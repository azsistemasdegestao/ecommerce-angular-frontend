import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { login } from '../api/generated/fn/auth/login';
import { refreshToken as refreshTokenFn } from '../api/generated/fn/auth/refresh-token';
import { logout as logoutFn } from '../api/generated/fn/auth/logout';
import { registerUser } from '../api/generated/fn/auth/register-user';
import { forgotPassword as forgotPasswordFn } from '../api/generated/fn/auth/forgot-password';
import { resetPassword as resetPasswordFn } from '../api/generated/fn/auth/reset-password';
import { ApiConfiguration } from '../api/generated/api-configuration';
import { LoginResponse } from '../api/generated/models/login-response';
import { RegisterUserCommand } from '../api/generated/models/register-user-command';
import { ResetPasswordCommand } from '../api/generated/models/reset-password-command';
import { UserDto } from './user.model';
import { decodeJwt, roleFromJwt } from './jwt.util';

export const REFRESH_TOKEN_STORAGE_KEY = 'ecommerce_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  private accessToken: string | null = null;

  private readonly _currentUser = signal<UserDto | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  private applySession(response: LoginResponse): void {
    this.accessToken = response.access_token;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refresh_token);
    }
    this.setCurrentUserFromToken(response.access_token);
  }

  private setCurrentUserFromToken(token: string): void {
    const decoded = decodeJwt(token);
    if (!decoded) {
      this._currentUser.set(null);
      return;
    }
    this._currentUser.set({
      id: decoded.sub,
      email: decoded.email,
      role: (roleFromJwt(decoded) as UserDto['role']) ?? null,
    });
  }

  async login(email: string, password: string): Promise<void> {
    const resp = await firstValueFrom(
      login(this.http, this.apiConfig.rootUrl, { body: { email, password } }),
    );
    this.applySession(resp.body!);
  }

  async register(command: RegisterUserCommand): Promise<void> {
    await firstValueFrom(registerUser(this.http, this.apiConfig.rootUrl, { body: command }));
  }

  /** Used by the interceptor and the app initializer to silently rotate the session. */
  async refresh(): Promise<boolean> {
    const refresh_token = this.getRefreshToken();
    if (!refresh_token) return false;
    try {
      const resp = await firstValueFrom(
        refreshTokenFn(this.http, this.apiConfig.rootUrl, { body: { refresh_token } }),
      );
      this.applySession(resp.body!);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    await firstValueFrom(forgotPasswordFn(this.http, this.apiConfig.rootUrl, { body: { email } }));
  }

  async resetPassword(command: ResetPasswordCommand): Promise<void> {
    await firstValueFrom(resetPasswordFn(this.http, this.apiConfig.rootUrl, { body: command }));
  }

  async logout(): Promise<void> {
    const refresh_token = this.getRefreshToken();
    try {
      if (refresh_token) {
        await firstValueFrom(logoutFn(this.http, this.apiConfig.rootUrl, { body: { refresh_token } }));
      }
    } catch {
      // logout is best-effort on the client side regardless of the API response
    } finally {
      this.clearSession();
    }
  }

  /** Forces a local logout without calling the API, e.g. after a failed refresh on 401. */
  clearSession(): void {
    this.accessToken = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
    this._currentUser.set(null);
  }
}
