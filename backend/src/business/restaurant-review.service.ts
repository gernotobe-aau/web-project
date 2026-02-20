import { RestaurantRepository, RestaurantReview } from "../repositories/restaurant.repository";
import { ValidationError } from "../middleware/error.middleware";

export class RestaurantReviewService {
    constructor(private restaurantRepo: RestaurantRepository) {}

    /**
     * create Restaurant Review
     */
    async createRestaurantReview(customerId: string, restaurantReview: RestaurantReview): Promise<RestaurantReview>{
        const errors: string[] = [];
        if(!restaurantReview){
            errors.push('review empty!');
            throw new ValidationError(errors);
        }
        restaurantReview.customerId = customerId
        const createdReview = this.restaurantRepo.createRestaurantReview(restaurantReview);
        return createdReview;
    }

    async getRestaurantReviewsByRestaurantId(restaurantId: string): Promise<RestaurantReview[]>{
        return this.restaurantRepo.getRestaurantReviews(restaurantId);
    }
}