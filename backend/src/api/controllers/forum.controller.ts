import { Request, Response, NextFunction } from "express";
import { ForumService } from "../../business/forum.service";

export class ForumController{
    constructor(private forumService: ForumService){}


    /**
     * GET /api/forum/discussions
     */
    getForum = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const userRestaurantId = (req as any).user?.restaurantId;
            const queryRestaurantId = req.query.restaurantId as string | undefined;

            // Determine which restaurant's menu to fetch
            const restaurantId = userRestaurantId || queryRestaurantId;

            if (!restaurantId) {
                return res.status(403).json({ message: 'Restaurantid erforderlich' });
            }
            const discussions = await this.forumService.getDiscussions(restaurantId)
            res.json(discussions);

        }catch(e){
            next(e)
        }
    }


    getMessages = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const queryDiscussionId = req.params.discussionId as string;
            if(!queryDiscussionId){
                return res.status(403).json({message: 'Fehler beim abschicken der Nachricht'})
            }
            const messages = await this.forumService.getMessages(queryDiscussionId)
            res.json(messages)
        }catch(e){
            next(e)
        }
    }

    createDiscussion = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const user = (req as any).user;
            const customerId = user.sub;
            const restaurantId = req.params.restaurantId as string;
            const name = req.params.name
            const description = req.params.description
            if(!customerId || !restaurantId){
                return  res.status(400).json({message: 'Kein Customer oder Restaurant Id beim Erstellen einer Diskussion:', customerId, restaurantId})
            }
            const discussion = await this.forumService.createDiscussion(customerId, restaurantId, name, description)
            res.status(201).json(discussion)
        }catch(e){
            next(e)
        }
    }

    createComment = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const user = (req as any).user;
            const customerId = user.sub;
            const discussionId = req.params.discussionId as string
            const text = req.params.text
            const message = await this.forumService.createComment(customerId, discussionId, text)
            res.status(201).json(message)
        }catch(e){
            next(e)
        }
    }

    /**
     * depending on req, either close discussion or delete it, both require restaurantid
     * @param req 
     * @param res 
     * @param next 
     */
    changeDiscussion = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const status = req.params.status
            const discussionId = req.params.discussionId
            const user = (req as any).user
            if(discussionId && status){
                if(status === "DELETE" || status === "delete"){
                    const message = await this.forumService.deleteDiscussion(discussionId, user.sub)
                    res.status(201).json(message)
                }else if (status === "CLOSE" || status === "close"){
                    const message = await this.forumService.closeDiscussion(discussionId, user.sub)
                    res.status(201).json(message)
                }else{
                    return res.status(403).json({message: 'Unknown command for discussion'})
                }
                
            }
            return res.status(403).json({message: 'No discussionId found'})
        }catch(e){
            next(e)
        }
    }

    /**
     * depending on the req, either delete or edit comment. delete can be called with customer and restaurant id
     * but edit only by the customer who created the comment
     * @param req 
     * @param res 
     * @param next 
     */
    changeComment = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const status = req.params.status
            const commentId = req.params.commentId
            
            const user = (req as any).user;
            const userId = user.sub;


            if(userId){
                if(commentId && status){
                    if(status === "DELETED" || status === "deleted"){
                        const message = await this.forumService.deleteComment(commentId, user.sub)
                        res.status(201).json(message)
                    }else if(status === "EDITED" || status === "edited"){
                        const text: string = req.params.text
                        const message = await this.forumService.editComment(commentId, text, user.sub)
                        res.status(201).json(message)
                    }else{
                        return res.status(400).json({message: 'No viable status found:', status})
                    }
                }
            }else{
                return res.status(403).json({message: 'Not authorized to change Comment'})
            }
            return res.status(403).json({message: 'No commentId or status found', commentId, status})
        }catch(e){
            next(e)
        }
    }
}