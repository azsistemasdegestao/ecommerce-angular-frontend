import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/api/api-error';
import { ButtonComponent } from '../../shared/button/button.component';
import { InputComponent } from '../../shared/input/input.component';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  template: `
    <div class="mx-auto max-w-sm p-8 md:p-10">
      <h1 class="mb-6 font-display text-2xl italic text-charcoal">Log in</h1>

      @if (infoMessage()) {
        <p class="mb-4 text-sm text-emerald-700">{{ infoMessage() }}</p>
      }
      @if (errorMessage()) {
        <p class="mb-4 text-sm text-red-700" role="alert">{{ errorMessage() }}</p>
      }

      <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
        <app-input
          label="Email"
          type="email"
          formControlName="email"
          [errorMessage]="emailError()"
        />
        <app-input
          label="Password"
          type="password"
          formControlName="password"
          [errorMessage]="passwordError()"
        />
        <app-button type="submit" [loading]="isSubmitting()">Log in</app-button>
      </form>

      <div class="mt-4 flex justify-between text-sm">
        <a class="text-champagne hover:underline" routerLink="/register">Create account</a>
        <a class="text-champagne hover:underline" routerLink="/forgot-password">Forgot password?</a>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly infoMessage = signal(
    this.route.snapshot.queryParamMap.get('registered') === '1'
      ? 'Account created, please log in.'
      : '',
  );

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected emailError(): string {
    const control = this.form.controls.email;
    if (control.touched && control.hasError('required')) return 'Email is required.';
    if (control.touched && control.hasError('email')) return 'Enter a valid email.';
    return '';
  }

  protected passwordError(): string {
    const control = this.form.controls.password;
    if (control.touched && control.hasError('required')) return 'Password is required.';
    return '';
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    const { email, password } = this.form.getRawValue();

    try {
      await this.authService.login(email, password);
      const returnUrl =
        this.route.snapshot.queryParamMap.get('returnUrl') ??
        (this.authService.currentUser()?.role === 'Admin' ? '/admin' : '/');
      await this.router.navigateByUrl(returnUrl);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 401) {
        this.errorMessage.set('Invalid email or password.');
      } else if (apiError.status === 423 || apiError.status === 429) {
        this.errorMessage.set('Too many attempts, try again in a few minutes.');
      } else {
        this.errorMessage.set('Something went wrong. Please try again.');
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
