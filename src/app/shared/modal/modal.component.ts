import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent, ButtonVariant } from '../button/button.component';

@Component({
  selector: 'app-modal',
  imports: [ButtonComponent],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          @if (title) {
            <h2 class="mb-4 text-lg font-semibold text-gray-900">{{ title }}</h2>
          }
          <div class="mb-6 text-sm text-gray-700">
            <ng-content />
          </div>
          <div class="flex justify-end gap-2">
            <app-button variant="ghost" (click)="cancel.emit()">{{ cancelLabel }}</app-button>
            <app-button [variant]="confirmVariant" [loading]="confirmLoading" (click)="confirm.emit()">
              {{ confirmLabel }}
            </app-button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmLoading = false;
  @Input() confirmVariant: ButtonVariant = 'danger';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
