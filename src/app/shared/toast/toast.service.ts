import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(variant: ToastVariant, message: string, durationMs = 5000): void {
    const id = this.nextId++;
    this._toasts.update((toasts) => [...toasts, { id, variant, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
