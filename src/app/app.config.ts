import {
  ApplicationConfig,
  inject,
  PLATFORM_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { ApiConfiguration, provideApiConfiguration } from './core/api/generated/api-configuration';
import { AuthService } from './core/auth/auth.service';
import { environment } from '../environments/environment';
import { initBrowserTracing } from '../browser-tracing';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      if (isPlatformBrowser(inject(PLATFORM_ID))) initBrowserTracing();
    }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideApiConfiguration(environment.apiBaseUrl),
    provideAppInitializer(() => {
      // inject() only works synchronously, before any `await` — capture
      // everything needed up front, then do the async work below.
      const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
      const apiConfig = inject(ApiConfiguration);
      const authService = inject(AuthService);

      return (async () => {
        // In the browser, the static `environment.apiBaseUrl` is a build-time
        // value; the container's actual API_BASE_URL is fetched at runtime
        // here so the same image can target different backends per environment.
        if (isBrowser) {
          try {
            const response = await fetch('/api/config');
            const { apiBaseUrl } = (await response.json()) as { apiBaseUrl: string };
            if (apiBaseUrl) {
              apiConfig.rootUrl = apiBaseUrl;
            }
          } catch {
            // Fall back to the build-time environment.apiBaseUrl on failure.
          }
        }

        if (authService.getRefreshToken()) {
          await authService.refresh();
        }
      })();
    }),
  ],
};
