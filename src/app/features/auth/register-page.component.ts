import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/api/api-error';
import { ButtonComponent } from '../../shared/button/button.component';
import { InputComponent } from '../../shared/input/input.component';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  template: `
    <div class="mx-auto max-w-sm p-6">
      <h1 class="mb-6 text-xl font-semibold">Create account</h1>

      @if (errorMessage()) {
        <p class="mb-4 text-sm text-red-600" role="alert">{{ errorMessage() }}</p>
      }

      <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
        <app-input label="First name" formControlName="first_name" [errorMessage]="requiredError('first_name')" />
        <app-input label="Last name" formControlName="last_name" [errorMessage]="requiredError('last_name')" />
        <app-input
          label="Email"
          type="email"
          formControlName="email"
          [errorMessage]="emailError()"
        />
        <app-input label="Password" type="password" formControlName="password" [errorMessage]="requiredError('password')" />
        <app-input
          label="Confirm password"
          type="password"
          formControlName="confirmPassword"
          [errorMessage]="confirmPasswordError()"
        />
        <app-button type="submit" [loading]="isSubmitting()">Create account</app-button>
      </form>

      <p class="mt-4 text-sm">
        Already have an account?
        <a class="text-blue-600 hover:underline" routerLink="/login">Log in</a>
      </p>
    </div>
  `,
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly emailServerError = signal('');

  protected readonly form = this.fb.nonNullable.group(
    {
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected requiredError(field: 'first_name' | 'last_name' | 'password'): string {
    const control = this.form.controls[field];
    return control.touched && control.hasError('required') ? 'This field is required.' : '';
  }

  protected emailError(): string {
    if (this.emailServerError()) return this.emailServerError();
    const control = this.form.controls.email;
    if (control.touched && control.hasError('required')) return 'Email is required.';
    if (control.touched && control.hasError('email')) return 'Enter a valid email.';
    return '';
  }

  protected confirmPasswordError(): string {
    const control = this.form.controls.confirmPassword;
    if (control.touched && control.hasError('required')) return 'Confirm your password.';
    if (this.form.hasError('passwordsMismatch') && control.touched) return 'Passwords do not match.';
    return '';
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.emailServerError.set('');
    if (this.form.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    const { first_name, last_name, email, password } = this.form.getRawValue();

    try {
      await this.authService.register({ first_name, last_name, email, password });
      await this.router.navigate(['/login'], { queryParams: { registered: '1' } });
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 409) {
        this.emailServerError.set('This email is already registered.');
      } else {
        this.errorMessage.set('Something went wrong. Please try again.');
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
