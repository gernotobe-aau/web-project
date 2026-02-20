import { NextFunction, Request, Response } from "express";
import { RestaurantReviewService } from "../../business/restaurant-review.service";

export class RestaurantReviewController{
    constructor(private restaurantReviewService: RestaurantReviewService){}

    createReview = (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        const customerId = user.sub;
        
        try{
            const review = this.restaurantReviewService.createRestaurantReview(customerId, req.body)
            res.status(200).json(review)
        }catch(error){
            console.log('Error when creating review in controller:', error)
            next(error)
        }
    }

    getReviewsByRId = async (req: Request, res: Response) => {
        try{
            const userRestaurantId = (req as any).user?.restaurantId;
            const queryRestaurantId = req.query.restaurantId as string | undefined;

            const restaurantId = queryRestaurantId || userRestaurantId;

            if(!restaurantId){
                return res.status(403).json({message: "RestaurantId erforderlich"})
            }
            const reviews = await this.restaurantReviewService.getRestaurantReviewsByRestaurantId(restaurantId)
            res.status(200).json(reviews);
        }catch(err){
            console.log('Error when getting restaurant reviews:', err)
        }
    }
}
