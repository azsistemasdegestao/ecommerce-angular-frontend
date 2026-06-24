import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/api/api-error';
import { ButtonComponent } from '../../shared/button/button.component';
import { InputComponent } from '../../shared/input/input.component';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  template: `
    <div class="mx-auto max-w-sm p-6">
      <h1 class="mb-6 text-xl font-semibold">Forgot password</h1>

      @if (errorMessage()) {
        <p class="mb-4 text-sm text-red-600" role="alert">{{ errorMessage() }}</p>
      }

      @if (submitted()) {
        <p class="mb-4 text-sm text-green-700" role="status">
          If that email exists, you'll receive instructions to reset your password.
        </p>
        <a class="text-sm text-blue-600 hover:underline" routerLink="/login">Back to login</a>
      } @else {
        <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
          <app-input label="Email" type="email" formControlName="email" [errorMessage]="emailError()" />
          <app-button type="submit" [loading]="isSubmitting()">Send instructions</app-button>
        </form>
      }
    </div>
  `,
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly isSubmitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected emailError(): string {
    const control = this.form.controls.email;
    if (control.touched && control.hasError('required')) return 'Email is required.';
    if (control.touched && control.hasError('email')) return 'Enter a valid email.';
    return '';
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.forgotPassword(this.form.getRawValue().email);
      this.submitted.set(true);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 429) {
        const seconds = apiError.retryAfterSeconds ?? 0;
        this.errorMessage.set(`Too many attempts. Try again in ${seconds}s.`);
      } else {
        // BR-FE-AUTH-002: any other outcome still shows the generic success
        // message, regardless of whether the email actually exists.
        this.submitted.set(true);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
