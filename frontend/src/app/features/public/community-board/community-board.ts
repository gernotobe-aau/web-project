import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject, NgModule, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { Restaurant, RestaurantService } from '../../../core/services/restaurant.service';
import { Discussion, Comment, ForumService, DiscussionStatus, CommentStatus } from '../../../core/services/forum.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatFormFieldModule } from '@angular/material/form-field';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatInputModule } from '@angular/material/input';
import { User } from '../../../core/models/auth.models';


@Component({
  selector: 'app-order-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatListModule,
    MatDividerModule,
    RouterModule
  ],
  templateUrl: './community-board.html',
  styleUrls: ['./community-board.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommunityBoardComponent implements OnInit, OnDestroy {
  discussions: Discussion[] = [];
  displayedDiscussions: Discussion[] = [];
  showClosed: boolean = false; // Hide close questions by default
  loading: boolean = false;
  customerId: string = '';
  restaurantId: string = '';
  closedCount: number = 0
  isModerator: boolean = false;
  
  private refreshInterval: any;
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 seconds

  //OrderStatus = OrderStatus;

  constructor(
    private forumService: ForumService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private restaurantService : RestaurantService,
    private route: ActivatedRoute
  ) {}

  /**
   * TrackBy function for ngFor performance
   */
  trackByDiscussionId(index: number, discussion: Discussion): string {
    return discussion.id;
  }

  ngOnInit(): void {
    // Get ID from authenticated user
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.customerId = user.id;
      this.route.paramMap.subscribe(params => {
      this.restaurantId = params.get('id')!;
      console.log('Restaurant id:', this.restaurantId);
      console.log('User restaurantId:', user.restaurantId)

      })
      
      this.loadDiscussions();
      this.startAutoRefresh();
      if(user.restaurantId === this.restaurantId){
        this.isModerator = true;
      }else{
        this.isModerator = false;
      }
    } else {
      this.snackBar.open('ID nicht gefunden', 'OK', { duration: 5000 });
    }
    //populate restaurants
    //const restaurants = this.
    /*this.restaurantService.getRestaurants().subscribe({
      next: (restaurant) =>{
        this.allRestaurants = restaurant || []
        console.log('Loaded restaurants:', restaurant)
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('Error loading restaurant:', err)
        this.cdr.detectChanges()
      }
    })*/
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  /**
   * Load all discussions from API
   * @param silent If true, don't show loading spinner
   */
  loadDiscussions(silent: boolean = false): void {
    if (!silent) {
      this.loading = true;
      this.cdr.markForCheck();
    }

    //this.allRestaurants.forEach(restaurant => {
      //let rId = restaurant.id
      this.forumService.getDiscussions(this.restaurantId).subscribe({
        next: (discussions) => {
          console.log('Loaded Discussions:', discussions)
          this.discussions = discussions;
          console.log('Discussions now:', this.discussions)
          this.closedCount = discussions.filter(o => 
            [discussions, DiscussionStatus.CLOSED].includes(o.status)
          ).length;
          this.displayedDiscussions = this.sortDiscussions(this.discussions);
          console.log('Displayed discussion:', this.discussions)

          // Auto-expand pending and preparing orders on initial load
          /*if (!silent) {
            this.expandedOrderIds.clear();
            discussions.forEach(order => {
              if ([OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING].includes(order.status)) {
                this.expandedOrderIds.add(order.id);
              }
            });
          }*/
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.log('Error when loading discussions:', err)
          this.loading = false;
          this.cdr.markForCheck();
          if (!silent) {
            this.snackBar.open('Fehler beim Laden des Forums', 'Wiederholen', { 
              duration: 5000 
            }).onAction().subscribe(() => {
              this.loadDiscussions();
            });
          }
        }
      });
    //});
  }

  addDiscussion(): void{
    
    
    /**this.forumService.createDiscussion(this.restaurantId, '', '').subscribe({
      next: d => {
        this.loadDiscussions()
      },
      error: e => {
        console.log('Error creating comment:', e)
      }
    })*/

  }

  closeDiscussion(discussionId: string): void{
    this.forumService.changeDiscussion(discussionId, DiscussionStatus.CLOSED).subscribe({
      next: (discussion) =>{
        this.loadDiscussions()
      },
      error: (e) => {
        console.log('error occured closing discussion:', e)
      }
    })
  }

  deleteDiscussion(discussionId: string): void{
    this.forumService.changeDiscussion(discussionId, DiscussionStatus.DELETED).subscribe({
      next: (discussion) =>{
        this.loadDiscussions()
      },
      error: (e) => {
        console.log('error occured deleting discussion:', e)
      }
    })
  }

  /**
   * Sort orders by time: newest first (simple descending by createdAt)
   */
  sortDiscussions(discussions: Discussion[]): Discussion[] {
    // Filter out completed orders if showCompleted is false
    const filtered = this.showClosed 
      ? discussions 
      : discussions.filter(o => ![DiscussionStatus.CLOSED].includes(o.status));
    
    // Simple sort by createdAt descending (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Toggle showing completed orders
   */
  toggleClosed(): void {
    this.showClosed = !this.showClosed;
    this.displayedDiscussions = this.sortDiscussions(this.discussions);
    this.cdr.markForCheck();
  }

  
  /**
   * Update discussion status to next status in workflow
   */
  updateStatus(discussion: Discussion, newStatus: DiscussionStatus): void {
    this.forumService.changeDiscussion(discussion.id, newStatus).subscribe({
      next: () => {
        discussion.status = newStatus;
        //discussion.updatedAt = new Date().toISOString();
        // Remove from expanded if now completed
        //if ([DiscussionStatus.CLOSED, DiscussionStatus.DELETED].includes(newStatus)) {
          //this.expandedOrderIds.delete(discussion.id);
        //}
        this.displayedDiscussions = [...this.sortDiscussions(this.discussions)];
        this.cdr.markForCheck();
      },
      error: (err) => {
        //this.snackBar.open(this.forumService.getErrorMessage(err), 'OK', { duration: 5000 });
        console.log('Error when updating status:', err)
        this.loadDiscussions();
      }
    });
  }


  /**
   * Get status badge color
   */
  getStatusColor(status: DiscussionStatus | CommentStatus): string {
    switch (status) {
      case DiscussionStatus.OPEN || CommentStatus.PUBLISHED:
        return 'primary';
      case DiscussionStatus.CLOSED:
        return 'accent';
      case DiscussionStatus.DELETED || CommentStatus.DELETED:
        return 'warn';
      default:
        return '';
    }
  }

  /**
   * Get human-readable status label
   */
  getStatusLabel(status: DiscussionStatus | CommentStatus): string {
    const labels: Record<DiscussionStatus | CommentStatus, string> = {
      [DiscussionStatus.OPEN]: 'Geöffnet',
      [DiscussionStatus.CLOSED]: 'Geschlossen',
      [DiscussionStatus.DELETED || CommentStatus.DELETED]: 'Gelöscht',
      [CommentStatus.PUBLISHED]: ''
    };
    return labels[status] || status;
  }

  /**
   * Start automatic refresh interval
   */
  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.loadDiscussions(true);
    }, this.REFRESH_INTERVAL_MS);
  }

  /**
   * Stop automatic refresh interval
   */
  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Get count of new pending orders
   */
  private getNewDiscussionCount(newDiscussions: Discussion[]): number {
    const currentPendingIds = this.discussions
      .filter(d => d.status === DiscussionStatus.OPEN)
      .map(d => d.id);
    return newDiscussions
      .filter(d => d.status === DiscussionStatus.OPEN && !currentPendingIds.includes(d.id))
      .length;
  }

  /**
   * get correct username for the discussion. restaurantOwner => Moderator
   */
  displayDiscussionName(discussion: Discussion): string{
    if(discussion.isFromModerator){
      return 'Moderator'
    }else{
      return discussion.userName!
    }
  }

  /**
   * Check if discussion is the first open discussion (should be highlighted)
   */
  //private isFirstPending(discussion: Discussion): boolean {
    //const pendingDiscussion = this.displayedDiscussions.filter(d => d.status === DiscussionStatus.OPEN);
    //return pendingDiscussion.length > 0 && pendingDiscussion[0].id === discussion.id;
  //}

  /**
   * Format date to local string
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  fmtDate(date: Date): string {
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calculate total items count
   */
  getTotalComments(discussion: Discussion): number {
    if (discussion.comments.length !== undefined && discussion.comments.length > 0) {
      return discussion.comments.length
    }
    return 0;
  }

  openCreateDiscussionDialog() {
      const dialogRef = this.dialog.open(AddDiscussionDialog, {
        data: {discussion: {} as DiscussionData}
      });
  
      dialogRef.afterClosed().subscribe(result => {
        console.log(`Dialog result: ${result}`);
        if(result){
          const name = result.title
          const desc = result.desc
          
          this.forumService.createDiscussion(this.restaurantId, name, desc).subscribe({
            next: (c) =>{ 
              console.log('created discussion:', c)
              this.loadDiscussions()
            },
            error: (e) => { console.log('Error creating discussion:', e)}
          })
        }
      });
  }
}


@Component({
  selector: 'create-discussion-dialog',
  standalone: true,
  templateUrl: 'create-discussion-dialog.html',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule, MatFormFieldModule, TextFieldModule, FormsModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDiscussionDialog {
  readonly dialogRef = inject(MatDialogRef<AddDiscussionDialog>);
  data = inject(MAT_DIALOG_DATA)
  readonly discussion = model(this.data.discussion)
  discussionTitle: string = ''
  discussionDesc: string = ''
  currentUser = ''

  addDiscussion(): void{
    //this.dialogRef.
  }


  onCancelClick(): void{
    this.dialogRef.close();
  }
}

export interface DiscussionData{
  title: string;
  desc: string;
}