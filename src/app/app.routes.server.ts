import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Routes guarded by authGuard/adminGuard rely on the refresh token in
  // localStorage, which is unavailable during SSR. Rendering them client-side
  // lets the guard re-evaluate in the browser instead of redirecting before
  // hydration ever runs.
  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'orders', renderMode: RenderMode.Client },
  { path: 'orders/:id', renderMode: RenderMode.Client },
  { path: 'orders/:id/payment', renderMode: RenderMode.Client },
  { path: 'account', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  // Auth forms have no SEO value and are interactive-heavy; SSR + hydration
  // here only risks a race where the first keystroke lands before Angular's
  // event binding attaches (observed: lost input on the very first field).
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'register', renderMode: RenderMode.Client },
  { path: 'forgot-password', renderMode: RenderMode.Client },
  { path: 'reset-password', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
