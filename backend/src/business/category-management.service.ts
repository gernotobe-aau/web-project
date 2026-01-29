import { CategoryRepository, CreateCategoryData, UpdateCategoryData } from '../repositories/category.repository';

interface ValidationError {
  field: string;
  message: string;
}

export class CategoryManagementService {
  constructor(private categoryRepository: CategoryRepository) {}

  /**
   * Get all categories for a restaurant
   */
  async getCategories(restaurantId: string | number) {
    return this.categoryRepository.findByRestaurantId(restaurantId);
  }

  /**
   * Create a new category
   */
  async createCategory(restaurantId: number, name: string) {
    // Validation
    const errors = this.validateCategoryData({ name });
    if (errors.length > 0) {
      throw { statusCode: 422, errors };
    }

    // Check for duplicate name
    const trimmedName = name.trim();
    const existing = await this.categoryRepository.findByRestaurantAndName(restaurantId, trimmedName);
    if (existing) {
      throw {
        statusCode: 422,
        errors: [{ field: 'name', message: 'Eine Kategorie mit diesem Namen existiert bereits' }],
      };
    }

    // Get max display order and add 1
    const maxOrder = await this.categoryRepository.getMaxDisplayOrder(restaurantId);

    const data: CreateCategoryData = {
      restaurant_id: restaurantId,
      name: trimmedName,
      display_order: maxOrder + 1,
    };

    return this.categoryRepository.create(data);
  }

  /**
   * Update a category
   */
  async updateCategory(categoryId: number, restaurantId: number, name: string) {
    // Check if category exists and belongs to restaurant
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw { statusCode: 404, message: 'Kategorie nicht gefunden' };
    }
    if (category.restaurant_id !== restaurantId) {
      throw { statusCode: 404, message: 'Kategorie nicht gefunden' };
    }

    // Validation
    const errors = this.validateCategoryData({ name });
    if (errors.length > 0) {
      throw { statusCode: 422, errors };
    }

    // Check for duplicate name (excluding current category)
    const trimmedName = name.trim();
    const existing = await this.categoryRepository.findByRestaurantAndName(restaurantId, trimmedName);
    if (existing && existing.id !== categoryId) {
      throw {
        statusCode: 422,
        errors: [{ field: 'name', message: 'Eine Kategorie mit diesem Namen existiert bereits' }],
      };
    }

    const data: UpdateCategoryData = {
      name: trimmedName,
    };

    return this.categoryRepository.update(categoryId, data);
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: number, restaurantId: number) {
    // Check if category exists and belongs to restaurant
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw { statusCode: 404, message: 'Kategorie nicht gefunden' };
    }
    if (category.restaurant_id !== restaurantId) {
      throw { statusCode: 404, message: 'Kategorie nicht gefunden' };
    }

    // Delete category (dishes will be set to NULL due to ON DELETE SET NULL)
    const deleted = await this.categoryRepository.delete(categoryId);
    return deleted;
  }

  /**
   * Reorder categories
   */
  async reorderCategories(restaurantId: number, categoryIds: number[]) {
    // Validation
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw {
        statusCode: 422,
        errors: [{ field: 'categoryIds', message: 'categoryIds muss ein nicht-leeres Array sein' }],
      };
    }

    // Get all categories for the restaurant
    const categories = await this.categoryRepository.findByRestaurantId(restaurantId);
    const categoryIdSet = new Set(categories.map((c) => c.id));

    // Validate that all provided IDs belong to the restaurant
    for (const id of categoryIds) {
      if (!categoryIdSet.has(id)) {
        throw {
          statusCode: 422,
          errors: [
            {
              field: 'categoryIds',
              message: 'Alle Kategorien müssen zum Restaurant gehören',
            },
          ],
        };
      }
    }

    // Validate that all categories are included
    if (categoryIds.length !== categories.length) {
      throw {
        statusCode: 422,
        errors: [
          {
            field: 'categoryIds',
            message: 'Alle Kategorien des Restaurants müssen enthalten sein',
          },
        ],
      };
    }

    // Create order updates
    const orderUpdates = categoryIds.map((id, index) => ({
      id,
      display_order: index,
    }));

    await this.categoryRepository.reorder(orderUpdates);
    return { success: true };
  }

  /**
   * Validate category data
   */
  private validateCategoryData(data: { name: string }): ValidationError[] {
    const errors: ValidationError[] = [];

    // Name validation
    if (!data.name || typeof data.name !== 'string') {
      errors.push({ field: 'name', message: 'Name ist erforderlich' });
    } else {
      const trimmedName = data.name.trim();
      if (trimmedName.length < 2) {
        errors.push({ field: 'name', message: 'Name muss mindestens 2 Zeichen lang sein' });
      }
      if (trimmedName.length > 50) {
        errors.push({ field: 'name', message: 'Name darf maximal 50 Zeichen lang sein' });
      }
    }

    return errors;
  }
}
