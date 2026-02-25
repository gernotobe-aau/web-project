import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from '../../../environments/environment';


export interface Discussion{
    id: string;
    restaurantId: string;
    userId: string | null; //in case customer's account gets deleted
    userName: string | null
    name: string;
    description: string;
    isFromModerator: boolean;
    createdAt: Date;
    lastActive: Date;
    comments: Comment[];
    status: DiscussionStatus
}

export enum DiscussionStatus{
    OPEN = 'open',
    CLOSED = 'closed',
    DELETED = 'deleted'
}

export interface Comment{
    id: string;
    userId: string;
    userName: string;
    discussionId: string
    isFromModerator: boolean;
    text: string;
    createdAt: Date;
    edited: boolean;
    status: CommentStatus
}

export enum CommentStatus{
    PUBLISHED = 'published',
    DELETED = 'deleted'
}

@Injectable({
    providedIn: 'root'
})
export class ForumService{
    constructor(private http: HttpClient){}

    getDiscussions(restaurantId: string): Observable<Discussion[]>{
        let params = new HttpParams();
        if (restaurantId !== undefined) {
            params = params.set('restaurantId', restaurantId);
        }
        return this.http.get<Discussion[]>(`${environment.apiBaseUrl}/forum/discussions`, {params});
    }

    getDiscussionById(discussionId: string): Observable<Discussion>{
        let params = new HttpParams()
        if(discussionId !== undefined){
            params = params.set('discussionId', discussionId)
        }
        return this.http.get<Discussion>(`${environment.apiBaseUrl}/forum/discussion`, {params});
    }

    getComments(discussionId: string): Observable<Comment[]>{
        let params = new HttpParams();
        if (discussionId !== undefined) {
            params = params.set('discussionId', discussionId);
        }
        return this.http.get<Comment[]>(`${environment.apiBaseUrl}/forum/comments`, {params});
    }

    createDiscussion(restaurantId: string, name: string, description: string): Observable<Discussion>{
        let data = {} as Discussion
        if (restaurantId !== undefined) {
            data.restaurantId = restaurantId
            data.name = name
            data.description = description
        }
        return this.http.post<Discussion>(`${environment.apiBaseUrl}/forum/discussions`, data )
    }

    createComment(discussionId: string, text: string): Observable<void>{
        let data = {} as Comment
        data.discussionId = discussionId
        data.text = text
        return this.http.post<void>(`${environment.apiBaseUrl}/forum/comments`, data )
    }

    changeDiscussion(discussionId: string, status: DiscussionStatus): Observable<void>{
        let params = new HttpParams();
        let discussion = {} as Discussion
        if (discussionId !== undefined) {
            discussion.id = discussionId;
        }
        if(status !== undefined){
            discussion.status = status
        }
        return this.http.patch<void>(`${environment.apiBaseUrl}/forum/discussions`, discussion)
    }

    changeComment(commentId: string, status: CommentStatus, text: string): Observable<void>{
        let comment = {} as Comment
        comment.id = commentId
        comment.status = status
        comment.text = text
        return this.http.patch<void>(`${environment.apiBaseUrl}/forum/comments`, comment)
    }
}