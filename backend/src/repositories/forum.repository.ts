import { Database } from "sqlite3"
import { v4 as uuidv4 } from 'uuid';

export interface Discussion{
    id: string;
    restaurantId: string;
    userId: string;
    userName: string;
    isFromModerator: boolean;
    name: string;
    description: string;
    createdAt: Date;
    lastActive: Date;
    status: DiscussionStatus
}

export enum DiscussionStatus{
    OPEN = 'open',
    CLOSED = 'closed',
    DELETED = 'deleted'
}

export interface Comment{
    id: string;
    discussionId: string;
    userId: string;
    userName: string;
    isFromModerator: boolean;
    text: string;
    createdAt: Date;
    edited: boolean;
    status: CommentStatus
}

export enum CommentStatus{
    PUBLISHED = 'published',
    DELETEDBYUSER = 'deletedbyuser',
    DELETEDBYRESTAURANT = 'deletedbyrestaurant'
}


export class ForumRepository{
    constructor(private db: Database){}

    async findByRestaurantIdForOwner(restaurantId: string | number, isModerator: boolean): Promise<Discussion[]> {
        if(isModerator){ //Mods should see deleted discussions
            return new Promise((resolve, reject) =>{
            const query = `
            SELECT 
            d.*, u.first_name, u.last_name
            FROM forum_discussions d
            LEFT JOIN customers u ON d.user_id = u.id
            WHERE d.restaurant_id = ?
            ORDER BY d.last_active DESC
            `

            this.db.all(query, [restaurantId], (err, rows: any[]) => {
                if (err) reject(err);
                else{
                    resolve(rows.map(mapRowToDiscussion));
                }
            });
        })
        }
        return new Promise((resolve, reject) =>{
            const query = `
            SELECT 
            d.*, u.first_name, u.last_name
            FROM forum_discussions d
            LEFT JOIN customers u ON d.user_id = u.id
            WHERE d.restaurant_id = ? AND NOT d.discussion_status = ?
            ORDER BY d.last_active DESC
            `

            this.db.all(query, [restaurantId, DiscussionStatus.DELETED], (err, rows: any[]) => {
                if (err) reject(err);
                else{
                    resolve(rows.map(mapRowToDiscussion));
                }
            });
        })
    }

    async findDiscussion(id: string): Promise<Discussion> {
        return new Promise((resolve, reject) =>{
            const query = `
            SELECT 
            d.*, u.first_name, u.last_name
            FROM forum_discussions d
            LEFT JOIN customers u ON d.user_id = u.id
            WHERE d.id = ?
            `

            this.db.get(query, [id], (err, row: any) => {
                if (err) reject(err);
                else{
                    resolve(mapRowToDiscussion(row));
                }
            });
        })
    }

    async createDiscussion(customerId: string, restaurantId: string, name: string, description: string, isModerator: boolean): Promise<Discussion>{
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            const query = `
                INSERT INTO forum_discussions (
                id, restaurant_id, user_id, discussion_name, discussion_description, discussion_status, is_from_moderator
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(
                query,
                [
                id,
                restaurantId,
                customerId,
                name,
                description,
                DiscussionStatus.OPEN,
                isModerator
                ],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.findDiscussion(id)
                        .then(discussion => resolve(discussion!))
                        .catch(reject);
                    }
                }
            );
        })
    }

    async closeDiscussion(discussionId: string): Promise<Discussion>{
        return new Promise((resolve, reject) => {
            const query = `
            UPDATE forum_discussions 
            SET 
            discussion_status = ?,
            last_active = CURRENT_TIMESTAMP
            WHERE id = ?
            `;
            this.db.run(
                query,
                [
                    DiscussionStatus.CLOSED,
                    discussionId
                ],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.findDiscussion(discussionId)
                        .then(discussion => resolve(discussion!))
                        .catch(reject);
                    }
                }
            );
        })
    }

    async deleteDiscussion(discussionId: string): Promise<Discussion>{
        return new Promise((resolve, reject) => {
            const query = `
            UPDATE forum_discussions 
            SET 
            discussion_status = ?,
            last_active = CURRENT_TIMESTAMP
            WHERE id = ?
            `;
            this.db.run(
                query,
                [
                    DiscussionStatus.DELETED,
                    discussionId
                ],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.findDiscussion(discussionId)
                        .then(discussion => resolve(discussion!))
                        .catch(reject);
                    }
                }
            );
        })
    }




    async loadComments(discussionId: string): Promise<Comment[]>{
        return new Promise((resolve, reject) =>{
            const query = `
            SELECT 
            c.*, u.first_name, u.last_name 
            FROM forum_comments c
            LEFT JOIN customers u ON c.user_id = u.id
            WHERE c.discussion_id = ? AND comment_status = ?
            ORDER BY c.created_at DESC
            `

            this.db.all(query, [discussionId, CommentStatus.PUBLISHED], (err, rows: any[]) => {
                if (err) reject(err);
                else{
                    resolve(rows.map(mapRowToComment));
                }
            });
        })
    }

    async createComment(customerId: string, discussionId: string, text: string, isModerator: boolean): Promise<Comment>{
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            const query = `
                INSERT INTO forum_comments (
                id, discussion_id, user_id, comment_text, comment_status, is_from_moderator
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            this.db.run(
                query,
                [
                id,
                discussionId,
                customerId,
                text,
                CommentStatus.PUBLISHED,
                isModerator
                ],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.db.run(`UPDATE forum_discussions SET last_active = CURRENT_TIMESTAMP WHERE id = ?`, [discussionId], (suberr) => {
                            if(err) reject(err);
                            this.findComment(id)
                            .then(comment => resolve(comment!))
                            .catch(reject);
                        })
                    }
                }
            );
        })
    }

    async deleteComment(commentId: string, deletedByRestaurant: boolean): Promise<Comment>{
        return new Promise((resolve, reject) => {
            const query = `
            UPDATE forum_comments
            SET 
            comment_status = ?
            WHERE id = ?
            `;
            const deleted = deletedByRestaurant ? CommentStatus.DELETEDBYRESTAURANT : CommentStatus.DELETEDBYUSER
            this.db.run(
                query,
                [
                    deleted,
                    commentId
                ],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.findComment(commentId)
                        .then(comment => resolve(comment!))
                        .catch(reject);
                    }
                }
            );
        })
    }

    async findComment(id: string): Promise<Comment> {
        return new Promise((resolve, reject) =>{
            const query = `
            SELECT 
            c.*
            FROM forum_comments c
            WHERE c.id = ?
            `

            this.db.get(query, [id], (err, row: any) => {
                if (err) reject(err);
                else{
                    resolve(mapRowToComment(row));
                }
            });
        })
    }
}


function mapRowToDiscussion(row: any): Discussion{
    return {
        id: row.id,
        restaurantId: row.restaurant_id,
        userId: row.user_id,
        userName: row.first_name ? row.first_name + " " + row.last_name?.substring(0,1) + "." : "", //either mod or deleted user
        isFromModerator: row.is_from_moderator,
        name: row.discussion_name,
        description: row.discussion_description,
        createdAt: row.created_at,
        lastActive: row.last_active,
        status: row.discussion_status
    }
}

function mapRowToComment(row: any): Comment{
    return {
        id: row.id,
        discussionId: row.discussion_id,
        userId: row.user_id,
        userName: row.first_name ? row.first_name + " " + row.last_name?.substring(0,1) + "." : "", //either mod or deleted user
        isFromModerator: row.is_from_moderator,
        createdAt: row.created_at,
        text: row.comment_text,
        edited: row.edited,
        status: row.comment_status
    }
}