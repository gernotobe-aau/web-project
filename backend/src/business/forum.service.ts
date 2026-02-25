import { Database } from "sqlite3";
import { Comment, Discussion, ForumRepository } from "../repositories/forum.repository";
import { ValidationError } from "../middleware/error.middleware";
import { RestaurantRepository } from "../repositories/restaurant.repository";
import { NotFoundError, AuthorizationError } from "../middleware/error.middleware";

export class ForumService{
    forumRepository: ForumRepository
    restaurantRepo: RestaurantRepository
    constructor(private db: Database) {
        this.forumRepository = new ForumRepository(db)
        this.restaurantRepo = new RestaurantRepository(db)
    }


    async getDiscussions(restaurantId: string, customerId: string): Promise<Discussion[]>{
        const restaurant = await this.restaurantRepo.findById(restaurantId);
        if(!restaurant) throw new NotFoundError(`Restaurant not found:, ${restaurantId}`)
        const isModerator = restaurant.ownerId === customerId
        return this.forumRepository.findByRestaurantIdForOwner(restaurantId, isModerator);
    }

    async getDiscussionById(discussionId: string): Promise<Discussion>{
        return this.forumRepository.findDiscussion(discussionId);
    }

    async getMessages(discussionId: string): Promise<Comment[]>{
        return this.forumRepository.loadComments(discussionId)
    }

    async createDiscussion(customerId: string, restaurantId: string, name: string, description: string): Promise<Discussion>{
        const restaurant = await this.restaurantRepo.findById(restaurantId);
        if(!restaurant) throw new NotFoundError(`Restaurant not found:, ${restaurantId}`)
        const isModerator = restaurant.ownerId === customerId

        
        return this.forumRepository.createDiscussion(customerId, restaurantId, name, description, isModerator)
    }

    async closeDiscussion(discussionId: string, ownerId: string): Promise<Discussion>{
        const discussion = await this.forumRepository.findDiscussion(discussionId);
        if(!discussion) throw new ValidationError('Kein Restaurant für die Diskussion gefunden')
        await this.checkOwnerAuthorization(discussion.restaurantId, ownerId)

        return this.forumRepository.closeDiscussion(discussionId)
    }

    async deleteDiscussion(discussionId: string, ownerId: string): Promise<Discussion>{
        const discussion = await this.forumRepository.findDiscussion(discussionId);
        if(!discussion) throw new ValidationError('Kein Restaurant für die Diskussion gefunden')
        const owner = await this.checkOwnerAuthorization(discussion.restaurantId, ownerId)

        return this.forumRepository.deleteDiscussion(discussionId)
    }

    async createComment(customerId: string, discussionId: string, text: string): Promise<Comment>{
        if(!customerId){
            throw new ValidationError('Kein Customer Id beim Erstellen eines Kommentars')
        }
        if(!discussionId){
            throw new ValidationError('Kein Discussion Id beim Erstellen eines Kommentars')
        }
        if(!text){
            throw new ValidationError('Kein Text beim Erstellen eines Kommentars')
        }
        const discussion = await this.forumRepository.findDiscussion(discussionId)
        const restaurant = await this.restaurantRepo.findById(discussion.restaurantId);
        if(!restaurant) throw new NotFoundError(`Restaurant not found:, ${discussion.restaurantId}`)
        const isModerator = restaurant.ownerId === customerId

        return this.forumRepository.createComment(customerId, discussionId, text, isModerator)
    }

    async deleteComment(commentId: string, userId: string): Promise<Comment>{
        let deletedByRestaurant = false
        const comment = await this.forumRepository.findComment(commentId)
        if(!comment) throw new NotFoundError('Comment not found')
        if(comment.userId !== userId){
            const discussion = await this.forumRepository.findDiscussion(comment.discussionId)
            await this.checkOwnerAuthorization(discussion.restaurantId, userId)
            deletedByRestaurant = true;
        }
        return this.forumRepository.deleteComment(commentId, deletedByRestaurant)
    }

    /**
       * Check if owner is authorized for the restaurant
       */
      private async checkOwnerAuthorization(restaurantId: string, ownerId: string) {
        const restaurant = await this.restaurantRepo.findById(restaurantId);
        if (!restaurant) {
          throw new NotFoundError('Restaurant not found');
        }
    
        if (restaurant.ownerId !== ownerId) {
          throw new AuthorizationError('You do not have permission to manage discussions/comments for this restaurant');
        }
      }
}