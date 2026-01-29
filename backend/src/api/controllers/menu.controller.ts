import { Request, Response, NextFunction } from 'express';
import { CategoryManagementService } from '../../business/category-management.service';
import { DishManagementService } from '../../business/dish-management.service';

export class MenuController {
  constructor(
    private categoryService: CategoryManagementService,
    private dishService: DishManagementService
  ) {}

  // ===== CATEGORY ENDPOINTS =====

  /**
   * GET /api/menu/categories
   * Get all categories for a restaurant
   * Can be called by:
   * 1. Restaurant owner (uses their restaurantId from JWT)
   * 2. Customer viewing a specific restaurant's menu (uses restaurantId query param)
   */
  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRestaurantId = (req as any).user?.restaurantId;
      const queryRestaurantId = req.query.restaurantId as string | undefined;

      // Determine which restaurant's menu to fetch
      const restaurantId = queryRestaurantId || userRestaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Restaurantid erforderlich' });
      }

      const categories = await this.categoryService.getCategories(restaurantId);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/menu/categories
   * Create a new category
   */
  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const { name } = req.body;

      const category = await this.categoryService.createCategory(restaurantId, name);
      res.status(201).json(category);
    } catch (error: any) {
      if (error.statusCode === 422) {
        return res.status(422).json({ errors: error.errors });
      }
      next(error);
    }
  };

  /**
   * PUT /api/menu/categories/:categoryId
   * Update a category
   */
  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const categoryId = parseInt(req.params.categoryId, 10);
      const { name } = req.body;

      if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Ungültige Kategorie-ID' });
      }

      const category = await this.categoryService.updateCategory(categoryId, restaurantId, name);
      res.json(category);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ message: error.message });
      }
      if (error.statusCode === 422) {
        return res.status(422).json({ errors: error.errors });
      }
      next(error);
    }
  };

  /**
   * DELETE /api/menu/categories/:categoryId
   * Delete a category
   */
  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const categoryId = parseInt(req.params.categoryId, 10);

      if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Ungültige Kategorie-ID' });
      }

      await this.categoryService.deleteCategory(categoryId, restaurantId);
      res.status(204).send();
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  };

  /**
   * PUT /api/menu/categories/reorder
   * Reorder categories
   */
  reorderCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const { categoryIds } = req.body;

      const result = await this.categoryService.reorderCategories(restaurantId, categoryIds);
      res.json(result);
    } catch (error: any) {
      if (error.statusCode === 422) {
        return res.status(422).json({ errors: error.errors });
      }
      next(error);
    }
  };

  // ===== DISH ENDPOINTS =====

  /**
   * GET /api/menu/dishes
   * Get all dishes (optionally filtered by category and/or restaurant)
   * Can be called by:
   * 1. Restaurant owner (uses their restaurantId from JWT)
   * 2. Customer viewing a specific restaurant's menu (uses restaurantId query param)
   */
  getDishes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRestaurantId = (req as any).user?.restaurantId;
      const queryRestaurantId = req.query.restaurantId as string | undefined;

      // Determine which restaurant's dishes to fetch
      const restaurantId = queryRestaurantId || userRestaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Restaurantid erforderlich' });
      }

      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;

      const dishes = await this.dishService.getDishes(restaurantId, categoryId);
      res.json(dishes);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/menu/dishes/:dishId
   * Get a single dish
   */
  getDish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const dishId = parseInt(req.params.dishId, 10);

      if (isNaN(dishId)) {
        return res.status(400).json({ message: 'Ungültige Gericht-ID' });
      }

      const dish = await this.dishService.getDish(dishId, restaurantId);
      res.json(dish);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  };

  /**
   * POST /api/menu/dishes
   * Create a new dish
   */
  createDish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const { name, description, price, categoryId, display_order } = req.body;
      const photoUrl = (req as any).file ? `/uploads/dishes/${(req as any).file.filename}` : undefined;

      const dish = await this.dishService.createDish(restaurantId, {
        name,
        description,
        price: parseFloat(price),
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        display_order: display_order ? parseInt(display_order, 10) : undefined,
        photoUrl,
      });

      res.status(201).json(dish);
    } catch (error: any) {
      if (error.statusCode === 422) {
        return res.status(422).json({ errors: error.errors });
      }
      next(error);
    }
  };

  /**
   * PUT /api/menu/dishes/:dishId
   * Update a dish
   */
  updateDish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const dishId = parseInt(req.params.dishId, 10);

      if (isNaN(dishId)) {
        return res.status(400).json({ message: 'Ungültige Gericht-ID' });
      }

      const { name, description, price, categoryId, display_order } = req.body;
      const photoUrl = (req as any).file ? `/uploads/dishes/${(req as any).file.filename}` : undefined;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId, 10) : null;
      if (display_order !== undefined) updateData.display_order = parseInt(display_order, 10);
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

      const dish = await this.dishService.updateDish(dishId, restaurantId, updateData);
      res.json(dish);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ message: error.message });
      }
      if (error.statusCode === 422) {
        return res.status(422).json({ errors: error.errors });
      }
      next(error);
    }
  };

  /**
   * PATCH /api/menu/dishes/:dishId
   * Partially update a dish (e.g., change category)
   */
  patchDish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const dishId = parseInt(req.params.dishId, 10);

      if (isNaN(dishId)) {
        return res.status(400).json({ message: 'Ungültige Gericht-ID' });
      }

      const { categoryId } = req.body;

      const dish = await this.dishService.updateDish(dishId, restaurantId, {
        categoryId: categoryId !== undefined ? (categoryId ? parseInt(categoryId, 10) : undefined) : undefined,
      });

      res.json(dish);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ message: error.message });
      }
      if (error.statusCode === 422) {
        return res.status(422).json({ errors: error.errors });
      }
      next(error);
    }
  };

  /**
   * DELETE /api/menu/dishes/:dishId
   * Delete a dish
   */
  deleteDish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const dishId = parseInt(req.params.dishId, 10);

      if (isNaN(dishId)) {
        return res.status(400).json({ message: 'Ungültige Gericht-ID' });
      }

      await this.dishService.deleteDish(dishId, restaurantId);
      res.status(204).send();
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  };

  /**
   * DELETE /api/menu/dishes/:dishId/photo
   * Delete a dish's photo
   */
  deleteDishPhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const dishId = parseInt(req.params.dishId, 10);

      if (isNaN(dishId)) {
        return res.status(400).json({ message: 'Ungültige Gericht-ID' });
      }

      const dish = await this.dishService.deleteDishPhoto(dishId, restaurantId);
      res.json(dish);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  };

  /**
   * PUT /api/menu/dishes/reorder
   * Reorder dishes
   */
  reorderDishes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const { dishIds } = req.body;

      const result = await this.dishService.reorderDishes(restaurantId, dishIds);
      res.json(result);
    } catch (error: any) {
      if (error.statusCode === 422) {
        return res.status(422).json({ errors: error.errors });
      }
      next(error);
    }
  };

  // ===== FULL MENU ENDPOINT =====

  /**
   * GET /api/menu/full
   * Get full menu with all categories and dishes
   */
  getFullMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = (req as any).user.restaurantId;

      if (!restaurantId) {
        return res.status(403).json({ message: 'Nur Restaurantbesitzer haben Zugriff' });
      }

      const menu = await this.dishService.getFullMenu(restaurantId);
      res.json(menu);
    } catch (error) {
      next(error);
    }
  };
}

