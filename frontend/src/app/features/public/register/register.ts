import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerRegistrationDto, RestaurantOwnerRegistrationDto, OpeningHour } from '../../../core/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  userType: 'customer' | 'restaurantOwner' = 'customer';
  isSubmitting = false;
  errorMessage = '';
  
  cuisineCategories = [
    'italienisch', 'asiatisch', 'deutsch', 'türkisch',
    'pizza', 'burger', 'vegetarisch', 'vegan',
    'indisch', 'mexikanisch', 'griechisch', 'amerikanisch',
    'fastfood', 'sushi'
  ];

  dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.registerForm = this.fb.group({
      // Common fields
      firstName: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[a-zA-ZäöüÄÖÜß\-\.]+$/)]],
      lastName: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[a-zA-ZäöüÄÖÜß\-\.]+$/)]],
      birthDate: ['', [Validators.required, this.ageValidator(16)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      
      // Customer-specific fields
      deliveryAddress: this.fb.group({
        street: ['', [Validators.required, Validators.maxLength(100)]],
        houseNumber: ['', [Validators.required, Validators.maxLength(10)]],
        staircase: ['', [Validators.maxLength(10)]],
        door: ['', [Validators.maxLength(10)]],
        postalCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
        city: ['', [Validators.required, Validators.maxLength(100)]]
      }),
      
      // Restaurant owner-specific fields
      restaurant: this.fb.group({
        name: ['', [Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/^[a-zA-ZäöüÄÖÜß0-9\.\-\/\s]+$/)]],
        address: this.fb.group({
          street: ['', [Validators.maxLength(100)]],
          houseNumber: ['', [Validators.maxLength(10)]],
          staircase: ['', [Validators.maxLength(10)]],
          door: ['', [Validators.maxLength(10)]],
          postalCode: ['', [Validators.pattern(/^\d{4}$/)]],
          city: ['', [Validators.maxLength(100)]]
        }),
        categories: [[], []],
        contactInfo: this.fb.group({
          phone: ['', [Validators.maxLength(20), Validators.pattern(/^[\+\d\s\-\(\)\/]+$/)]],
          email: ['', [Validators.email]]
        }),
        openingHours: this.fb.array(this.createDefaultOpeningHours())
      })
    }, { validators: this.passwordMatchValidator });

    this.updateFormValidators();
  }

  private createDefaultOpeningHours(): FormGroup[] {
    const hours: FormGroup[] = [];
    for (let day = 0; day < 7; day++) {
      const isClosed = day === 0; // Sunday closed by default
      hours.push(this.fb.group({
        dayOfWeek: [day],
        openTime: [isClosed ? '' : '11:00'],
        closeTime: [isClosed ? '' : '22:00'],
        isClosed: [isClosed]
      }));
    }
    return hours;
  }

  get openingHoursArray(): FormArray {
    return this.registerForm.get('restaurant.openingHours') as FormArray;
  }

  onUserTypeChange(type: 'customer' | 'restaurantOwner'): void {
    this.userType = type;
    
    // Update birth date age validator
    const birthDateControl = this.registerForm.get('birthDate');
    if (type === 'customer') {
      birthDateControl?.setValidators([Validators.required, this.ageValidator(16)]);
    } else {
      birthDateControl?.setValidators([Validators.required, this.ageValidator(18)]);
    }
    birthDateControl?.updateValueAndValidity();
    
    this.updateFormValidators();
  }

  private updateFormValidators(): void {
    const deliveryAddressGroup = this.registerForm.get('deliveryAddress');
    const restaurantGroup = this.registerForm.get('restaurant');
    
    if (this.userType === 'customer') {
      // Enable delivery address validators
      this.setGroupValidators(deliveryAddressGroup, true);
      // Disable restaurant validators
      this.setGroupValidators(restaurantGroup, false);
    } else {
      // Disable delivery address validators
      this.setGroupValidators(deliveryAddressGroup, false);
      // Enable restaurant validators
      this.setGroupValidators(restaurantGroup, true);
      
      // Set specific required validators for restaurant
      const restaurantNameControl = this.registerForm.get('restaurant.name');
      restaurantNameControl?.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZäöüÄÖÜß0-9\.\-\/\s]+$/)
      ]);
      
      const categoriesControl = this.registerForm.get('restaurant.categories');
      categoriesControl?.setValidators([Validators.required, this.minArrayLengthValidator(1)]);
      categoriesControl?.updateValueAndValidity();
      
      const phoneControl = this.registerForm.get('restaurant.contactInfo.phone');
      phoneControl?.setValidators([
        Validators.required,
        Validators.maxLength(20),
        Validators.pattern(/^[\+\d\s\-\(\)\/]+$/)
      ]);
      
      // Set required validators for restaurant address
      const restAddressGroup = this.registerForm.get('restaurant.address');
      this.setGroupValidators(restAddressGroup, true);
    }
  }

  private setGroupValidators(group: AbstractControl | null, required: boolean): void {
    if (!group) return;
    
    const formGroup = group as FormGroup;
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        if (required) {
          // Add required if not optional fields
          const optionalFields = ['staircase', 'door', 'email'];
          if (!optionalFields.includes(key)) {
            const currentValidators = control.validator ? [control.validator, Validators.required] : [Validators.required];
            control.setValidators(currentValidators);
          }
        } else {
          control.clearValidators();
        }
        control.updateValueAndValidity();
      }
    });
  }

  private minArrayLengthValidator(minLength: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return { required: true };
      if (!Array.isArray(control.value)) return { required: true };
      return control.value.length >= minLength ? null : { minLength: { required: minLength, actual: control.value.length } };
    };
  }

  private ageValidator(minAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age < minAge ? { minAge: { required: minAge, actual: age } } : null;
    };
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  copyMondayToAll(): void {
    const mondayHours = this.openingHoursArray.at(1).value;
    for (let i = 2; i <= 6; i++) { // Tuesday to Saturday
      this.openingHoursArray.at(i).patchValue({
        openTime: mondayHours.openTime,
        closeTime: mondayHours.closeTime,
        isClosed: mondayHours.isClosed
      });
    }
  }

  onCategoryChange(event: Event, category: string): void {
    const checkbox = event.target as HTMLInputElement;
    const categoriesControl = this.registerForm.get('restaurant.categories');
    const currentCategories = categoriesControl?.value || [];
    
    if (checkbox.checked) {
      categoriesControl?.setValue([...currentCategories, category]);
    } else {
      categoriesControl?.setValue(currentCategories.filter((c: string) => c !== category));
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    if (this.userType === 'customer') {
      this.registerCustomer();
    } else {
      this.registerRestaurantOwner();
    }
  }

  private registerCustomer(): void {
    const formValue = this.registerForm.value;
    const data: CustomerRegistrationDto = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      birthDate: formValue.birthDate,
      email: formValue.email,
      password: formValue.password,
      deliveryAddress: formValue.deliveryAddress
    };

    this.authService.registerCustomer(data).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/customer/dashboard']);
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 422 && err.error.details) {
          this.handleValidationErrors(err.error.details);
        } else {
          this.errorMessage = 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
        }
      }
    });
  }

  private registerRestaurantOwner(): void {
    // Clear any previous server-side errors so they don't persist
    this.clearServerErrors(this.registerForm);

    const formValue = this.registerForm.value;
    
    // Ensure all 7 days are included (even if closed)
    const openingHours = formValue.restaurant.openingHours || [];
    const allDays = [];
    for (let day = 0; day < 7; day++) {
      const existingDay = openingHours.find((h: any) => h.dayOfWeek === day);
      if (existingDay) {
        allDays.push(existingDay);
      } else {
        // If day is missing, add it as closed
        allDays.push({
          dayOfWeek: day,
          openTime: '',
          closeTime: '',
          isClosed: true
        });
      }
    }
    
    const data: RestaurantOwnerRegistrationDto = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      birthDate: formValue.birthDate,
      email: formValue.email,
      password: formValue.password,
      restaurant: {
        name: formValue.restaurant.name,
        address: formValue.restaurant.address,
        categories: (formValue.restaurant && formValue.restaurant.categories ? formValue.restaurant.categories : [])
          .map((c: string) => (c || '').toString().toLowerCase())
          .filter((c: string) => c.length > 0),
        contactInfo: formValue.restaurant.contactInfo,
        openingHours: allDays
      }
    };

    this.authService.registerRestaurantOwner(data).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/restaurant/dashboard']);
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 422 && err.error.details) {
          this.handleValidationErrors(err.error.details);
        } else {
          this.errorMessage = 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
        }
      }
    });
  }

  private handleValidationErrors(errors: Array<{ field: string; message: string }>): void {
    errors.forEach(error => {
      const control = this.registerForm.get(error.field);
      if (control) {
        control.setErrors({ serverError: error.message });
      } else {
        this.errorMessage = error.message;
      }
    });
  }

  private clearServerErrors(group: FormGroup | FormArray): void {
    Object.keys(group.controls).forEach(key => {
      const control = group.get(key);
      if (!control) return;

      // If it's a group/array, recurse
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.clearServerErrors(control as FormGroup | FormArray);
      }

      // Clear any serverError validation key without touching other errors
      const errors = control.errors;
      if (errors && errors['serverError']) {
        const { serverError, ...rest } = errors as any;
        control.setErrors(Object.keys(rest).length > 0 ? rest : null);
      }
    });
    
    // Revalidate after clearing server errors
    group.updateValueAndValidity({ emitEvent: false });
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

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'Dieses Feld ist erforderlich';
    if (control.errors['email']) return 'Ungültige E-Mail-Adresse';
    if (control.errors['minlength']) return `Mindestens ${control.errors['minlength'].requiredLength} Zeichen erforderlich`;
    if (control.errors['maxlength']) return `Maximal ${control.errors['maxlength'].requiredLength} Zeichen erlaubt`;
    if (control.errors['pattern']) return 'Ungültiges Format';
    if (control.errors['minAge']) return `Sie müssen mindestens ${control.errors['minAge'].required} Jahre alt sein`;
    if (control.errors['serverError']) return control.errors['serverError'];

    return 'Ungültige Eingabe';
  }
}
