import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TextFieldModule } from '@angular/cdk/text-field';

export interface RejectDialogData {
  orderId: string;
}

export interface RejectDialogResult {
  reason?: string;
}

@Component({
  selector: 'app-reject-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TextFieldModule
  ],
  templateUrl: './reject-order-dialog.component.html',
  styleUrls: ['./reject-order-dialog.component.css']
})
export class RejectOrderDialogComponent {
  reason: string = '';
  maxLength: number = 200;

  constructor(
    public dialogRef: MatDialogRef<RejectOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RejectDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close({ reason: this.reason.trim() || undefined });
  }

  get remainingChars(): number {
    return this.maxLength - this.reason.length;
  }
}
