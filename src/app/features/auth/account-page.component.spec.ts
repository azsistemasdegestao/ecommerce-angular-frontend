import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AccountPageComponent } from './account-page.component';
import { AuthService, REFRESH_TOKEN_STORAGE_KEY } from '../../core/auth/auth.service';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

describe('AccountPageComponent', () => {
  let fixture: ComponentFixture<AccountPageComponent>;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AccountPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'refresh-1');

    fixture = TestBed.createComponent(AccountPageComponent);
    fixture.detectChanges();
  });

  it('AC-FE-AUTH-U-06: logout clears the session even on a network failure', async () => {
    const component = fixture.componentInstance;
    const logoutPromise = component.logout();

    httpMock.expectOne(`${API}/api/v1/auth/logout`).error(new ProgressEvent('timeout'));

    await logoutPromise;

    expect(authService.currentUser()).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
  });
});
