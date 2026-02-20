import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { RestaurantReviewController } from "../controllers/restaurant-review.controller";
import { RestaurantRepository } from "../../repositories/restaurant.repository";
import { getDb } from "../../db/init";
import { RestaurantReviewService } from "../../business/restaurant-review.service";

const router = Router();

router.use(requireAuth)

//lazy init review controller
let restaurantReviewController: RestaurantReviewController | null = null;

function getRestaurantReviewController(): RestaurantReviewController{
    if (!restaurantReviewController) {
        const db = getDb();
        const restaurantReviewRepository = new RestaurantRepository(db);
        const restaurantReviewService = new RestaurantReviewService(restaurantReviewRepository);
        restaurantReviewController = new RestaurantReviewController(restaurantReviewService);
    }
    return restaurantReviewController;
}

// POST /api/restaurant-review
router.post('/restaurant-review', async(req, res, next) => {
    console.log('Received post reuest for review')
    const controller = getRestaurantReviewController();
    await controller.createReview(req, res, next);
})

// GET /api/restaurant-review
router.get('/restaurant-review', async(req, res) => {
    console.log('Received get request for review')
    const controller = getRestaurantReviewController();
    controller.getReviewsByRId(req, res);
})



export default router;