import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { CustomerProfile, CustomerProfileService } from '../../../core/services/customer-profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  profile: CustomerProfile | null = null;

  constructor(
    private fb: FormBuilder,
    private customerProfileService: CustomerProfileService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z0-9äöüÄÖÜß\.\-\/\s]+$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z0-9äöüÄÖÜß\.\-\/\s]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(50)
      ]],
      address: this.fb.group({
        street: ['', [Validators.required, Validators.maxLength(100)]],
        houseNumber: ['', [Validators.required, Validators.maxLength(10)]],
        staircase: [''],
        door: [''],
        postalCode: ['', [Validators.required, Validators.maxLength(10)]],
        city: ['', [Validators.required, Validators.maxLength(50)]]
      })
    });
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.customerProfileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.populateForm(profile);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.snackBar.open('Fehler beim Laden des Profils', 'Schließen', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  private populateForm(profile: CustomerProfile): void {
    this.profileForm.patchValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      address: {
        street: profile.address.street,
        houseNumber: profile.address.houseNumber,
        staircase: profile.address.staircase,
        door: profile.address.door,
        postalCode: profile.address.postalCode,
        city: profile.address.city
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      this.snackBar.open('Bitte korrigieren Sie die Fehler im Formular', 'Schließen', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSaving = true;
    const formValue = this.profileForm.value;

    this.customerProfileService.updateProfile(formValue).subscribe({
      next: (updatedProfile) => {
        this.profile = updatedProfile;
        this.populateForm(updatedProfile);
        this.isSaving = false;
        this.snackBar.open('Änderungen erfolgreich gespeichert', 'Schließen', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.isSaving = false;
        
        if (error.status === 422 && error.error?.errors) {
          // Handle validation errors
          const errors = error.error.errors;
          for (const err of errors) {
            if (err.field && this.profileForm.get(err.field)) {
              this.profileForm.get(err.field)?.setErrors({ backend: err.message });
            }
          }
          this.snackBar.open('Validierungsfehler - bitte prüfen Sie Ihre Eingaben', 'Schließen', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        } else {
          this.snackBar.open('Fehler beim Speichern der Änderungen', 'Schließen', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Dieses Feld ist erforderlich';
    }
    if (control.errors['minlength'] || control.errors['minLength']) {
      if (fieldName === 'categories') {
        return 'Mindestens eine Kategorie ist erforderlich';
      }
    }
    if (control.errors['maxLength']) {
      return `Maximal ${control.errors['maxLength'].requiredLength} Zeichen erlaubt`;
    }
    if (control.errors['email']) {
      return 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    }
    if (control.errors['pattern']) {
      if (fieldName === 'name') {
        return 'Nur Buchstaben, Zahlen, Punkt, Bindestrich, Schrägstrich und Leerzeichen erlaubt';
      }
      if (fieldName === 'contactPhone') {
        return 'Nur Zahlen, +, -, Leerzeichen und Klammern erlaubt';
      }
    }
    if (control.errors['backend']) {
      return control.errors['backend'];
    }

    return 'Ungültige Eingabe';
  }

  get displayAddress(): string {
    if (!this.profile || !this.profile.address) return '';
    
    const addr = this.profile.address;
    let address = `${addr.street} ${addr.houseNumber}`;
    
    if (addr.staircase || addr.door) {
      address += ` / ${addr.staircase || ''}${addr.door ? ' / ' + addr.door : ''}`;
    }
    
    address += `, ${addr.postalCode} ${addr.city}`;
    
    return address;
  }
}
