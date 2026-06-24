import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

const VARIANT_CLASSES: Record<string, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-amber-600',
};

@Component({
  selector: 'app-toast',
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="rounded-md px-4 py-3 text-sm text-white shadow-lg"
          [class]="variantClass(toast.variant)"
          role="alert"
        >
          {{ toast.message }}
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  protected variantClass(variant: string): string {
    return VARIANT_CLASSES[variant] ?? VARIANT_CLASSES['error'];
  }
}
