import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuService, Category, Dish } from '../../../../core/services/menu.service';
import { environment } from '../../../../../environments/environment';

export interface DishDialogData {
  mode: 'create' | 'edit';
  dish?: Dish;
  categoryId?: number;
  categories: Category[];
}

@Component({
  selector: 'app-dish-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Gericht bearbeiten' : 'Neues Gericht' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="dishForm">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="dishForm.get('name')?.hasError('required')">
            Name ist erforderlich
          </mat-error>
          <mat-error *ngIf="dishForm.get('name')?.hasError('minlength')">
            Name muss mindestens 2 Zeichen lang sein
          </mat-error>
          <mat-error *ngIf="dishForm.get('name')?.hasError('maxlength')">
            Name darf maximal 100 Zeichen lang sein
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Beschreibung</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
          <mat-error *ngIf="dishForm.get('description')?.hasError('maxlength')">
            Beschreibung darf maximal 500 Zeichen lang sein
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Preis (€)</mat-label>
          <input matInput type="number" formControlName="price" step="0.01" min="0" max="999.99" required>
          <mat-error *ngIf="dishForm.get('price')?.hasError('required')">
            Preis ist erforderlich
          </mat-error>
          <mat-error *ngIf="dishForm.get('price')?.hasError('min')">
            Preis muss größer als 0 sein
          </mat-error>
          <mat-error *ngIf="dishForm.get('price')?.hasError('max')">
            Preis darf maximal 999.99 sein
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Kategorie</mat-label>
          <mat-select formControlName="categoryId">
            <mat-option [value]="null">Keine Kategorie</mat-option>
            <mat-option *ngFor="let category of data.categories" [value]="category.id">
              {{ category.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="photo-section">
          <div *ngIf="currentPhotoUrl && !photoDeleted" class="current-photo">
            <img [src]="currentPhotoUrl" alt="Aktuelles Foto">
            <button mat-button color="warn" type="button" (click)="removePhoto()">
              Foto löschen
            </button>
          </div>
          
          <div class="file-input-wrapper">
            <input type="file" #fileInput accept="image/jpeg,image/png,image/webp" 
                   (change)="onFileSelected($event)" style="display: none">
            <button mat-stroked-button type="button" (click)="fileInput.click()" [disabled]="loading">
              {{ currentPhotoUrl ? 'Neues Foto hochladen' : 'Foto hochladen' }}
            </button>
            <span *ngIf="selectedFileName" class="file-name">{{ selectedFileName }}</span>
          </div>
          
          <div *ngIf="photoPreview" class="photo-preview">
            <img [src]="photoPreview" alt="Vorschau">
          </div>
        </div>

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
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!dishForm.valid || loading">
        {{ isEditMode ? 'Speichern' : 'Erstellen' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      min-width: 400px;
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
      max-height: 70vh;
      overflow-y: auto;
    }

    .photo-section {
      margin: 16px 0;
    }

    .current-photo, .photo-preview {
      margin-bottom: 16px;
    }

    .current-photo img, .photo-preview img {
      max-width: 300px;
      max-height: 200px;
      display: block;
      margin-bottom: 8px;
      border-radius: 4px;
    }

    .file-input-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-name {
      font-size: 14px;
      color: #666;
    }
  `]
})
export class DishDialogComponent implements OnInit {
  dishForm: FormGroup;
  errorMessage: string | null = null;
  selectedFile: File | null = null;
  selectedFileName: string = '';
  photoPreview: string | null = null;
  currentPhotoUrl: string | null = null;
  photoDeleted: boolean = false;
  loading = false;

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  constructor(
    private fb: FormBuilder,
    private menuService: MenuService,
    private dialogRef: MatDialogRef<DishDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DishDialogData
  ) {
    this.dishForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      price: [0, [Validators.required, Validators.min(0.01), Validators.max(999.99)]],
      categoryId: [null]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.dish) {
      const dish = this.data.dish;
      this.dishForm.patchValue({
        name: dish.name,
        description: dish.description || '',
        price: dish.price,
        categoryId: dish.category_id
      });

      if (dish.photo_url) {
        this.currentPhotoUrl = environment.apiBaseUrl.replace('/api', '') + dish.photo_url;
      }
    } else if (this.data.categoryId) {
      this.dishForm.patchValue({
        categoryId: this.data.categoryId
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (5 MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Datei ist zu groß. Maximal 5 MB erlaubt.';
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.errorMessage = 'Nur JPEG, PNG und WebP Bilder sind erlaubt.';
        return;
      }

      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.errorMessage = null;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.currentPhotoUrl = null;
    this.photoDeleted = true;
  }

  onSubmit(): void {
    if (this.dishForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const formValue = this.dishForm.value;
    const dishData: any = {
      name: formValue.name,
      description: formValue.description || undefined,
      price: parseFloat(formValue.price),
      categoryId: formValue.categoryId || undefined,
      priority: parseInt(formValue.priority) || 0,
    };

    if (this.selectedFile) {
      dishData.photo = this.selectedFile;
    }

    const request$ = this.isEditMode
      ? this.menuService.updateDish(this.data.dish!.id, dishData)
      : this.menuService.createDish(dishData);

    request$.subscribe({
      next: (dish) => {
        // Handle photo deletion if needed
        if (this.isEditMode && this.photoDeleted && !this.selectedFile) {
          this.menuService.deleteDishPhoto(this.data.dish!.id).subscribe({
            next: () => this.dialogRef.close(dish),
            error: () => this.dialogRef.close(dish) // Still close even if deletion fails
          });
        } else {
          this.dialogRef.close(dish);
        }
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 422 && error.error.errors) {
          // Backend validation errors
          const errors = error.error.errors;
          this.errorMessage = errors.map((e: any) => e.message).join(', ');
        } else {
          this.errorMessage = this.isEditMode
            ? 'Fehler beim Aktualisieren des Gerichts'
            : 'Fehler beim Erstellen des Gerichts';
        }
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
