import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { MenuController } from '../controllers/menu.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { getDb } from '../../db/init';
import { CategoryRepository } from '../../repositories/category.repository';
import { DishRepository } from '../../repositories/dish.repository';
import { CategoryManagementService } from '../../business/category-management.service';
import { DishManagementService } from '../../business/dish-management.service';

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'dishes');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Ungültiges Dateiformat. Erlaubt sind: JPG, PNG, WebP'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// Apply authentication to all menu routes
router.use(requireAuth);

// Lazy initialization middleware for controller
let menuController: MenuController | null = null;

function getMenuController(): MenuController {
  if (!menuController) {
    const db = getDb();
    const categoryRepository = new CategoryRepository(db);
    const dishRepository = new DishRepository(db);
    const categoryService = new CategoryManagementService(categoryRepository);
    const dishService = new DishManagementService(dishRepository, categoryRepository);
    menuController = new MenuController(categoryService, dishService);
  }
  return menuController;
}

// Wrapper function to ensure controller is initialized
function withController(handler: (controller: MenuController) => (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const controller = getMenuController();
    return handler(controller)(req, res, next);
  };
}

// ===== CATEGORY ROUTES =====
router.get('/categories', withController(c => c.getCategories));
router.post('/categories', withController(c => c.createCategory));
router.put('/categories/reorder', withController(c => c.reorderCategories));
router.put('/categories/:categoryId', withController(c => c.updateCategory));
router.delete('/categories/:categoryId', withController(c => c.deleteCategory));

// ===== DISH ROUTES =====
router.get('/dishes', withController(c => c.getDishes));
router.get('/dishes/:dishId', withController(c => c.getDish));
router.post('/dishes', upload.single('photo'), withController(c => c.createDish));
router.put('/dishes/reorder', withController(c => c.reorderDishes));
router.put('/dishes/:dishId', upload.single('photo'), withController(c => c.updateDish));
router.patch('/dishes/:dishId', withController(c => c.patchDish));
router.delete('/dishes/:dishId', withController(c => c.deleteDish));
router.delete('/dishes/:dishId/photo', withController(c => c.deleteDishPhoto));

// ===== FULL MENU ROUTE =====
router.get('/full', withController(c => c.getFullMenu));

export default router;
