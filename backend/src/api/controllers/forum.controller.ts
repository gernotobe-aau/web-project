import { Request, Response, NextFunction } from "express";
import { ForumService } from "../../business/forum.service";

export class ForumController{
    constructor(private forumService: ForumService){}


    /**
     * GET /api/forum/discussions
     */
    getForum = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const user = (req as any).user
            const userRestaurantId = user.restaurantId;
            const queryRestaurantId = req.query.restaurantId as string | undefined;
            const userId = user.sub

            // Determine which restaurant's menu to fetch
            const restaurantId = userRestaurantId || queryRestaurantId;

            if (!restaurantId) {
                return res.status(403).json({ message: 'Restaurantid erforderlich' });
            }
            const discussions = await this.forumService.getDiscussions(restaurantId, userId )
            res.json(discussions);

        }catch(e){
            next(e)
        }
    }

    getDiscussionById = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const discussionId = req.query.discussionId as string
            if(!discussionId){
                return res.status(403).json({message: 'DiscussionId erforderlich'})
            }
            console.log('received command to get discussion by id')
            const discussion = await this.forumService.getDiscussionById(discussionId)

            res.status(200).json(discussion)
        }catch(e){
            next(e)
        }
    }


    getMessages = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const queryDiscussionId = req.query.discussionId as string
            console.log('received get comments for discussion;', queryDiscussionId, req.query)
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
            console.log('received post for discussion:', req.body)
            const user = (req as any).user;
            const customerId = user.sub;
            console.log(' discussion post user:', customerId)
            const restaurantId = req.body.restaurantId as string;
            const name = req.body.name
            const description = req.body.description
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
            const discussionId = req.body.discussionId as string
            const text = req.body.text as string
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
            
            const status = req.body.status
            const discussionId = req.body.id as string
            const user = (req as any).user
            console.log('Received command to change discussion:', discussionId, status )
            if(discussionId && status){
                if(status === "DELETED" || status === "deleted"){
                    const message = await this.forumService.deleteDiscussion(discussionId, user.sub)
                    res.status(201).json(message)
                }else if (status === "CLOSED" || status === "closed"){
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
            const status = req.body.status as string
            const commentId = req.body.id as string
            
            const user = (req as any).user;
            const userId = user.sub;


            if(userId){
                if(commentId && status){
                    if(status === "DELETED" || status === "deleted"){
                        console.log('received delete request for comment:', commentId, req.body)
                        const message = await this.forumService.deleteComment(commentId, user.sub)
                        res.status(204).json(message)
                    }else{
                        return res.status(400).json({message: 'No viable status found:', status})
                    }
                }
            }else{
                return res.status(403).json({message: 'Not authorized to change Comment'})
            }
            return res.status(422).json({message: 'No commentId or status found', commentId, status})
        }catch(e){
            next(e)
        }
    }
}