import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/api/api-error';
import { ButtonComponent } from '../../shared/button/button.component';
import { InputComponent } from '../../shared/input/input.component';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  template: `
    <div class="mx-auto max-w-sm p-8 md:p-10">
      <h1 class="mb-6 font-display text-2xl italic text-charcoal">Reset password</h1>

      @if (invalidToken()) {
        <p class="mb-4 text-sm text-red-700" role="alert">
          This reset link is invalid or has expired.
        </p>
        <a class="text-sm text-champagne hover:underline" routerLink="/forgot-password">
          Request a new link
        </a>
      } @else if (success()) {
        <p class="mb-4 text-sm text-emerald-700" role="status">
          Your password has been reset. You can now log in.
        </p>
        <a class="text-sm text-champagne hover:underline" routerLink="/login">Back to login</a>
      } @else {
        <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
          <app-input
            label="New password"
            type="password"
            formControlName="newPassword"
            [errorMessage]="requiredError('newPassword')"
          />
          <app-input
            label="Confirm new password"
            type="password"
            formControlName="confirmPassword"
            [errorMessage]="confirmPasswordError()"
          />
          <app-button type="submit" [loading]="isSubmitting()">Reset password</app-button>
        </form>
      }
    </div>
  `,
})
export class ResetPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly success = signal(false);
  protected readonly invalidToken = signal(false);

  private readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected requiredError(field: 'newPassword'): string {
    const control = this.form.controls[field];
    return control.touched && control.hasError('required') ? 'This field is required.' : '';
  }

  protected confirmPasswordError(): string {
    const control = this.form.controls.confirmPassword;
    if (control.touched && control.hasError('required')) return 'Confirm your new password.';
    if (this.form.hasError('passwordsMismatch') && control.touched) return 'Passwords do not match.';
    return '';
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.token) {
      if (!this.token) this.invalidToken.set(true);
      return;
    }

    this.isSubmitting.set(true);
    try {
      await this.authService.resetPassword({
        email: this.email,
        token: this.token,
        new_password: this.form.getRawValue().newPassword,
      });
      this.success.set(true);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 400 || apiError.status === 422) {
        this.invalidToken.set(true);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
