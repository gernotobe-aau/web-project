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
import { RestaurantProfileService, RestaurantProfile, OpeningHoursData } from '../../../core/services/restaurant-profile.service';

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
  profile: RestaurantProfile | null = null;
  
  availableCategories = [
    'italienisch',
    'asiatisch',
    'griechisch',
    'amerikanisch',
    'vegetarisch',
    'vegan',
    'fastfood',
    'burger',
    'pizza',
    'sushi',
    'indisch',
    'mexikanisch'
  ];
  
  daysOfWeek = [
    { key: 'monday', label: 'Montag' },
    { key: 'tuesday', label: 'Dienstag' },
    { key: 'wednesday', label: 'Mittwoch' },
    { key: 'thursday', label: 'Donnerstag' },
    { key: 'friday', label: 'Freitag' },
    { key: 'saturday', label: 'Samstag' },
    { key: 'sunday', label: 'Sonntag' }
  ];

  constructor(
    private fb: FormBuilder,
    private restaurantProfileService: RestaurantProfileService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z0-9äöüÄÖÜß\.\-\/\s]+$/)
      ]],
      categories: [[], [Validators.required, Validators.minLength(1)]],
      contactEmail: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(50)
      ]],
      contactPhone: ['', [
        Validators.maxLength(20),
        Validators.pattern(/^[\d\+\-\s\(\)]*$/)
      ]],
      openingHours: this.fb.array([])
    });
  }

  get openingHours(): FormArray {
    return this.profileForm.get('openingHours') as FormArray;
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.restaurantProfileService.getProfile().subscribe({
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

  private populateForm(profile: RestaurantProfile): void {
    this.profileForm.patchValue({
      name: profile.name,
      categories: profile.categories,
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone
    });

    // Clear existing opening hours
    while (this.openingHours.length > 0) {
      this.openingHours.removeAt(0);
    }

    // Add opening hours for each day
    for (const day of this.daysOfWeek) {
      const dayData = profile.openingHours.find(oh => oh.dayOfWeek === day.key);
      if (dayData) {
        this.openingHours.push(this.createDayFormGroup(dayData));
      } else {
        // Default: closed
        this.openingHours.push(this.createDayFormGroup({
          dayOfWeek: day.key,
          isClosed: true,
          timeSlots: []
        }));
      }
    }
  }

  private createDayFormGroup(dayData: OpeningHoursData): FormGroup {
    const group = this.fb.group({
      dayOfWeek: [dayData.dayOfWeek],
      isClosed: [dayData.isClosed],
      timeSlots: this.fb.array([])
    });

    const timeSlotsArray = group.get('timeSlots') as FormArray;
    
    if (!dayData.isClosed && dayData.timeSlots.length > 0) {
      for (const slot of dayData.timeSlots) {
        timeSlotsArray.push(this.createTimeSlotFormGroup(slot.start, slot.end));
      }
    }

    // Watch for changes in isClosed
    group.get('isClosed')?.valueChanges.subscribe(isClosed => {
      if (isClosed) {
        // Clear time slots when closed
        while (timeSlotsArray.length > 0) {
          timeSlotsArray.removeAt(0);
        }
      } else {
        // Add one time slot when opened
        if (timeSlotsArray.length === 0) {
          timeSlotsArray.push(this.createTimeSlotFormGroup('', ''));
        }
      }
    });

    return group;
  }

  private createTimeSlotFormGroup(start: string, end: string): FormGroup {
    return this.fb.group({
      start: [start, [
        Validators.required,
        Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      ]],
      end: [end, [
        Validators.required,
        Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      ]]
    }, { validators: this.timeSlotValidator.bind(this) });
  }

  private timeSlotValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('start')?.value;
    const end = control.get('end')?.value;

    if (!start || !end) {
      return null;
    }

    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes >= endMinutes) {
      return { timeOrder: 'Startzeit muss vor Endzeit liegen' };
    }

    return null;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getTimeSlotsForDay(dayIndex: number): FormArray {
    return this.openingHours.at(dayIndex).get('timeSlots') as FormArray;
  }

  addTimeSlot(dayIndex: number): void {
    const timeSlots = this.getTimeSlotsForDay(dayIndex);
    timeSlots.push(this.createTimeSlotFormGroup('', ''));
  }

  removeTimeSlot(dayIndex: number, slotIndex: number): void {
    const timeSlots = this.getTimeSlotsForDay(dayIndex);
    if (timeSlots.length > 1) {
      timeSlots.removeAt(slotIndex);
    }
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

    this.restaurantProfileService.updateProfile(formValue).subscribe({
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

  getTimeSlotErrorMessage(dayIndex: number, slotIndex: number, field: 'start' | 'end'): string {
    const timeSlots = this.getTimeSlotsForDay(dayIndex);
    const slot = timeSlots.at(slotIndex);
    const control = slot.get(field);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Erforderlich';
    }
    if (control.errors['pattern']) {
      return 'Format: HH:MM';
    }

    return '';
  }

  getTimeSlotGroupError(dayIndex: number, slotIndex: number): string {
    const timeSlots = this.getTimeSlotsForDay(dayIndex);
    const slot = timeSlots.at(slotIndex);

    if (slot.errors?.['timeOrder']) {
      return slot.errors['timeOrder'];
    }

    return '';
  }

  get displayAddress(): string {
    if (!this.profile) return '';
    
    const addr = this.profile.address;
    let address = `${addr.street} ${addr.houseNumber}`;
    
    if (addr.staircase || addr.door) {
      address += ` / ${addr.staircase || ''}${addr.door ? ' / ' + addr.door : ''}`;
    }
    
    address += `, ${addr.postalCode} ${addr.city}`;
    
    return address;
  }
}
