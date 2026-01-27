import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    // Clear incorrect errors when user types
    this.loginForm.valueChanges.subscribe(() => {
      const emailControl = this.loginForm.get('email');
      const passwordControl = this.loginForm.get('password');
      
      if (emailControl?.hasError('incorrect')) {
        emailControl.setErrors(
          emailControl.hasError('required') || emailControl.hasError('email') 
            ? { required: emailControl.hasError('required'), email: emailControl.hasError('email') } 
            : null
        );
      }
      
      if (passwordControl?.hasError('incorrect')) {
        passwordControl.setErrors(
          passwordControl.hasError('required') 
            ? { required: true } 
            : null
        );
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    // Clear previous incorrect errors before validating
    const emailControl = this.loginForm.get('email');
    const passwordControl = this.loginForm.get('password');
    
    if (emailControl?.hasError('incorrect')) {
      emailControl.setErrors(
        emailControl.hasError('required') || emailControl.hasError('email') 
          ? { required: emailControl.hasError('required'), email: emailControl.hasError('email') } 
          : null
      );
    }
    
    if (passwordControl?.hasError('incorrect')) {
      passwordControl.setErrors(
        passwordControl.hasError('required') 
          ? { required: true } 
          : null
      );
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    console.log('[LoginComponent] Submitting login for:', email);

    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('[LoginComponent] Login successful, response:', response);
        this.isSubmitting = false;
        console.log('[LoginComponent] Navigating to dashboard for role:', response.user.role);
        // Navigate based on user role
        if (response.user.role === 'customer') {
          this.router.navigate(['/']);
        } else if (response.user.role === 'restaurantOwner') {
          this.router.navigate(['/restaurant/menu-management']);
        } else {
          // Fallback
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 401) {
          this.errorMessage = 'E-Mail oder Passwort falsch';
          this.loginForm.get('email')?.setErrors({ incorrect: true });
          this.loginForm.get('password')?.setErrors({ incorrect: true });
        } else if (err.status === 429) {
          this.errorMessage = 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.';
        } else {
          this.errorMessage = 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
        }
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return 'Dieses Feld ist erforderlich';
    if (control.errors['email']) return 'Ungültige E-Mail-Adresse';

    return '';
  }
}
