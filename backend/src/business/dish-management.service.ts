import { DishRepository, CreateDishData, UpdateDishData } from '../repositories/dish.repository';
import { CategoryRepository } from '../repositories/category.repository';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ValidationError {
  field: string;
  message: string;
}

export class DishManagementService {
  constructor(
    private dishRepository: DishRepository,
    private categoryRepository: CategoryRepository
  ) {}

  /**
   * Get all dishes for a restaurant (optionally filtered by category)
   */
  async getDishes(restaurantId: string | number, categoryId?: number) {
    return this.dishRepository.findByRestaurantId(restaurantId, categoryId);
  }

  /**
   * Get a single dish
   */
  async getDish(dishId: number, restaurantId: string) {
    const dish = await this.dishRepository.findById(dishId);
    if (!dish) {
      throw { statusCode: 404, message: 'Gericht nicht gefunden' };
    }
    if (dish.restaurant_id !== restaurantId) {
      throw { statusCode: 404, message: 'Gericht nicht gefunden' };
    }
    return dish;
  }

  /**
   * Create a new dish
   */
  async createDish(
    restaurantId: string,
    data: {
      name: string;
      description?: string;
      price: number;
      categoryId?: number;
      display_order?: number;
      photoUrl?: string;
    }
  ) {
    // Validation
    const errors = await this.validateDishData(restaurantId, data);
    if (errors.length > 0) {
      throw { statusCode: 422, errors };
    }

    const dishData: CreateDishData = {
      restaurant_id: restaurantId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price: data.price,
      category_id: data.categoryId || null,
      display_order: data.display_order ?? 0,
      photo_url: data.photoUrl || null,
    };

    return this.dishRepository.create(dishData);
  }

  /**
   * Update a dish
   */
  async updateDish(
    dishId: number,
    restaurantId: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      categoryId?: number;
      display_order?: number;
      photoUrl?: string;
    }
  ) {
    // Check if dish exists and belongs to restaurant
    const dish = await this.dishRepository.findById(dishId);
    if (!dish) {
      throw { statusCode: 404, message: 'Gericht nicht gefunden' };
    }
    if (dish.restaurant_id !== restaurantId) {
      throw { statusCode: 404, message: 'Gericht nicht gefunden' };
    }

    // Validation
    const errors = await this.validateDishData(restaurantId, data, dishId);
    if (errors.length > 0) {
      throw { statusCode: 422, errors };
    }

    const updateData: UpdateDishData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId || null;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;
    if (data.photoUrl !== undefined) updateData.photo_url = data.photoUrl;

    return this.dishRepository.update(dishId, updateData);
  }

  /**
   * Delete a dish
   */
  async deleteDish(dishId: number, restaurantId: string) {
    // Check if dish exists and belongs to restaurant
    const dish = await this.dishRepository.findById(dishId);
    if (!dish) {
      throw { statusCode: 404, message: 'Gericht nicht gefunden' };
    }
    if (dish.restaurant_id !== restaurantId) {
      throw { statusCode: 404, message: 'Gericht nicht gefunden' };
    }

    // Delete photo file if exists
    if (dish.photo_url) {
      try {
        await this.deletePhotoFile(dish.photo_url);
      } catch (error) {
        // Log error but don't fail the deletion
        console.error('Failed to delete photo file:', error);
      }
    }

    const deleted = await this.dishRepository.delete(dishId);
    return deleted;
  }

  /**
   * Delete dish photo
   */
  async deleteDishPhoto(dishId: number, restaurantId: string) {
    // Check if dish exists and belongs to restaurant
    const dish = await this.dishRepository.findById(dishId);
    if (!dish) {
      throw { statusCode: 404, message: 'Gericht nicht gefunden' };
    }
    if (dish.restaurant_id !== restaurantId) {
      throw { statusCode: 404, message: 'Gericht nicht gefunden' };
    }

    if (!dish.photo_url) {
      return dish; // No photo to delete
    }

    // Delete photo file
    try {
      await this.deletePhotoFile(dish.photo_url);
    } catch (error) {
      console.error('Failed to delete photo file:', error);
    }

    // Update dish to remove photo_url
    return this.dishRepository.update(dishId, { photo_url: null });
  }

  /**
   * Reorder dishes
   */
  async reorderDishes(restaurantId: string, dishIds: number[]) {
    // Validation
    if (!Array.isArray(dishIds) || dishIds.length === 0) {
      throw {
        statusCode: 422,
        errors: [{ field: 'dishIds', message: 'dishIds muss ein nicht-leeres Array sein' }],
      };
    }

    // Verify all dishes belong to the restaurant
    const dishes = await Promise.all(dishIds.map((id) => this.dishRepository.findById(id)));

    for (let i = 0; i < dishes.length; i++) {
      const dish = dishes[i];
      if (!dish) {
        throw {
          statusCode: 422,
          errors: [{ field: 'dishIds', message: `Gericht mit ID ${dishIds[i]} nicht gefunden` }],
        };
      }
      if (dish.restaurant_id !== restaurantId) {
        throw {
          statusCode: 422,
          errors: [{ field: 'dishIds', message: 'Alle Gerichte müssen zum Restaurant gehören' }],
        };
      }
    }

    // Create display_order updates (higher index = higher display_order)
    const display_orderUpdates = dishIds.map((id, index) => ({
      id,
      display_order: dishIds.length - index, // Reverse order so first item has highest display_order
    }));

    await this.dishRepository.reorder(display_orderUpdates);
    return { success: true };
  }

  /**
   * Get full menu with categories and dishes
   */
  async getFullMenu(restaurantId: string) {
    return this.dishRepository.getFullMenu(restaurantId);
  }

  /**
   * Validate dish data
   */
  private async validateDishData(
    restaurantId: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      categoryId?: number;
      display_order?: number;
    },
    excludeDishId?: number
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Name validation
    if (data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string') {
        errors.push({ field: 'name', message: 'Name ist erforderlich' });
      } else {
        const trimmedName = data.name.trim();
        if (trimmedName.length < 2) {
          errors.push({ field: 'name', message: 'Name muss mindestens 2 Zeichen lang sein' });
        }
        if (trimmedName.length > 100) {
          errors.push({ field: 'name', message: 'Name darf maximal 100 Zeichen lang sein' });
        }
      }
    }

    // Description validation
    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== 'string') {
        errors.push({ field: 'description', message: 'Beschreibung muss ein Text sein' });
      } else if (data.description.trim().length > 500) {
        errors.push({
          field: 'description',
          message: 'Beschreibung darf maximal 500 Zeichen lang sein',
        });
      }
    }

    // Price validation
    if (data.price !== undefined) {
      if (typeof data.price !== 'number' || isNaN(data.price)) {
        errors.push({ field: 'price', message: 'Preis muss eine Zahl sein' });
      } else if (data.price <= 0) {
        errors.push({ field: 'price', message: 'Preis muss größer als 0 sein' });
      } else if (data.price > 999.99) {
        errors.push({ field: 'price', message: 'Preis darf maximal 999.99 sein' });
      }
    }

    // Category validation
    if (data.categoryId !== undefined && data.categoryId !== null) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        errors.push({ field: 'categoryId', message: 'Kategorie nicht gefunden' });
      } else if (category.restaurant_id !== restaurantId) {
        errors.push({ field: 'categoryId', message: 'Kategorie gehört nicht zum Restaurant' });
      }
    }

    // display_order validation
    if (data.display_order !== undefined) {
      if (typeof data.display_order !== 'number' || !Number.isInteger(data.display_order)) {
        errors.push({ field: 'display_order', message: 'Priorität muss eine Ganzzahl sein' });
      } else if (data.display_order < 0) {
        errors.push({ field: 'display_order', message: 'Priorität muss >= 0 sein' });
      }
    }

    return errors;
  }

  /**
   * Delete photo file from filesystem
   */
  private async deletePhotoFile(photoUrl: string): Promise<void> {
    // Extract filename from URL (assuming format like /uploads/dishes/filename.jpg)
    const filename = path.basename(photoUrl);
    const uploadsDir = path.join(process.cwd(), 'uploads', 'dishes');
    const filePath = path.join(uploadsDir, filename);

    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        // Only throw if it's not a "file not found" error
        throw error;
      }
    }
  }
}


