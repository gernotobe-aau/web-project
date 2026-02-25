import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/form-field';
import { MatDivider } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Restaurant, RestaurantService, OpeningHour } from '../../../core/services/restaurant.service';
import { User } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';
import { Comment, CommentStatus, Discussion, ForumService } from '../../../core/services/forum.service';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    FormsModule,
    MatFormField,
    MatLabel,
    MatInputModule,
    MatDivider
  ],
  templateUrl: './discussion.html',
  styleUrl: './discussion.css'
})
export class DiscussionComponent implements OnInit {
  restaurantId: string | null = null;
  discussionId: string | null = null;
  discussion: Discussion = {} as Discussion;
  restaurant: Restaurant | null = null;
  loading = true;
  error: string | null = null;
  currentUser: User | null = null;
  text: string = '';

  constructor(private route: ActivatedRoute, private commentService: ForumService, private cdr: ChangeDetectorRef,private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.route.paramMap.subscribe(params => {
      //this.restaurantId = params.get('id');
      this.discussionId = params.get('id')
      console.log('Discussion id:', this.discussionId);

      if (this.discussionId) {
        this.commentService.getDiscussionById(this.discussionId).subscribe({
          next: (discussion) => {
            this.discussion = discussion
            //this.restaurant
            this.commentService.getComments(discussion.id).subscribe({
              next: (comments) => {
                console.log('Fetched discussion data:', comments);
                const found = comments.find(c => c.discussionId === this.discussionId);
                console.log('Found discussion:', found);
                if(found){
                  this.error = null;
                } else {
                  this.error = 'Diskussion ist leer.';
                  //this.restaurant = null;
                }
                this.loading = false;
                this.cdr.markForCheck();
              },
              error : (err) => {
                console.error('Error fetching discussion data:', err);
                this.error = 'Failed to load discussion data.';
                this.loading = false;
                this.restaurant = null;
                this.cdr.markForCheck();
              }
            });
          },
          error: (e) => {
            console.error('Error fetching discussion:', e)
          }
        })
        
      }else{
        this.error = 'No Restaurant-ID.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
    this.loadComments();
  }


  saveComment(text: string): void {
    let comment = {} as Comment
    comment.userId = this.currentUser?.id!
    comment.text = text
    this.text = ''
    this.commentService.createComment(this.discussionId!, text).subscribe({
      next: (c) =>{
        console.log('successfully saved comment to backend:', c)
        this.loadComments()
      },
      error: (e) =>{
        console.log('error creating comment:', e)
      }
    })
    this.loadComments;
  }

  deleteComment(commentId: string):void{
    this.commentService.changeComment(commentId, CommentStatus.DELETED, "").subscribe({
      next: (c) =>{
        console.log('sucessfully edited comment:', c)
        this.loadComments()
      }
    })
  }

  loadComments(): void{
    this.commentService.getComments(this.discussionId!).subscribe({
      next: (c) =>{
        console.log('Received comments:', c)
        this.discussion.comments = c
        this.cdr.detectChanges()
      },
      error: (e) =>{
        console.log('error loading comments:', e)
      }
    })
  }  

  displayCommentName(comment: Comment): string{
    if(comment.isFromModerator){
      return 'Moderator'
    }else{
      return comment.userName
    }
  }
}
