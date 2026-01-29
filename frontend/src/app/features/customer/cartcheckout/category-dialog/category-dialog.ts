import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuService, Category } from '../../../../core/services/menu.service';

export interface CategoryDialogData {
  mode: 'create' | 'edit';
  category?: Category;
}

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Kategorie bearbeiten' : 'Neue Kategorie' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="categoryForm">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="categoryForm.get('name')?.hasError('required')">
            Name ist erforderlich
          </mat-error>
          <mat-error *ngIf="categoryForm.get('name')?.hasError('minlength')">
            Name muss mindestens 2 Zeichen lang sein
          </mat-error>
          <mat-error *ngIf="categoryForm.get('name')?.hasError('maxlength')">
            Name darf maximal 50 Zeichen lang sein
          </mat-error>
          <mat-error *ngIf="categoryForm.get('name')?.hasError('backend')">
            {{ categoryForm.get('name')?.errors?.['backend'] }}
          </mat-error>
        </mat-form-field>
        
        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="30"></mat-spinner>
          <span>Wird gespeichert...</span>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="loading">Abbrechen</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!categoryForm.valid || loading">
        {{ isEditMode ? 'Speichern' : 'Erstellen' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      min-width: 300px;
    }
    
    .error-message {
      color: #f44336;
      margin-top: 8px;
      font-size: 12px;
    }
    
    .loading-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    mat-dialog-content {
      padding-top: 20px;
    }
  `]
})
export class CategoryDialogComponent implements OnInit {
  categoryForm: FormGroup;
  errorMessage: string | null = null;
  loading = false;

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  constructor(
    private fb: FormBuilder,
    private menuService: MenuService,
    private dialogRef: MatDialogRef<CategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryDialogData
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.category) {
      this.categoryForm.patchValue({
        name: this.data.category.name
      });
    }
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const name = this.categoryForm.value.name.trim();

    const request$ = this.isEditMode
      ? this.menuService.updateCategory(this.data.category!.id, { name })
      : this.menuService.createCategory({ name });

    request$.subscribe({
      next: (category) => {
        this.dialogRef.close(category);
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 422 && error.error.errors) {
          // Backend validation errors
          const errors = error.error.errors;
          const nameError = errors.find((e: any) => e.field === 'name');
          if (nameError) {
            this.categoryForm.get('name')?.setErrors({ backend: nameError.message });
            this.errorMessage = nameError.message;
          } else {
            this.errorMessage = 'Validierungsfehler';
          }
        } else {
          this.errorMessage = this.isEditMode
            ? 'Fehler beim Aktualisieren der Kategorie'
            : 'Fehler beim Erstellen der Kategorie';
        }
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
