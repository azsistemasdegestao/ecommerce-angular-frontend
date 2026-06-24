import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ModalComponent } from '../../../../shared/modal/modal.component';

@Component({
  selector: 'app-refund-confirm-modal',
  imports: [DecimalPipe, ModalComponent],
  template: `
    <app-modal
      [open]="open"
      title="Refund payment"
      confirmLabel="Refund"
      [confirmLoading]="refunding"
      (confirm)="confirm.emit()"
      (cancel)="cancel.emit()"
    >
      Refund {{ amount | number: '1.2-2' }} for order #{{ orderId.slice(0, 8) }}? The associated order
      will also be cancelled.
    </app-modal>
  `,
})
export class RefundConfirmModalComponent {
  @Input() open = false;
  @Input() amount: number | string = 0;
  @Input() orderId = '';
  @Input() refunding = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
