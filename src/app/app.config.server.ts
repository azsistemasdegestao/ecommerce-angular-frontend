import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { provideApiConfiguration } from './core/api/generated/api-configuration';
import { environment } from '../environments/environment';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Overrides the client-only provideApiConfiguration in appConfig: during
    // SSR the container's real API_BASE_URL is already available via process.env.
    provideApiConfiguration(process.env['API_BASE_URL'] ?? environment.apiBaseUrl),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
