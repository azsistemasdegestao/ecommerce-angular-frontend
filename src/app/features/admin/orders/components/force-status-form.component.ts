import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent, SelectOption } from '../../../../shared/select/select.component';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { ModalComponent } from '../../../../shared/modal/modal.component';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
];

@Component({
  selector: 'app-force-status-form',
  imports: [ReactiveFormsModule, SelectComponent, ButtonComponent, ModalComponent],
  template: `
    <div class="flex items-end gap-3">
      <app-select label="Force status" [options]="statusOptions" [formControl]="statusControl" />
      <app-button (click)="confirmOpen.set(true)">Update status</app-button>
    </div>

    <app-modal
      [open]="confirmOpen()"
      title="Force order status"
      confirmLabel="Confirm"
      [confirmLoading]="submitting"
      (confirm)="confirmChange()"
      (cancel)="confirmOpen.set(false)"
    >
      Manually change this order's status to "{{ statusControl.value }}"? This bypasses the normal
      order flow.
    </app-modal>
  `,
})
export class ForceStatusFormComponent implements OnChanges {
  @Input() currentStatus = '';
  @Input() submitting = false;
  @Output() statusChange = new EventEmitter<string>();

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly confirmOpen = signal(false);
  protected readonly statusControl = new FormBuilder().control('', { nonNullable: true });

  private statusControlTouched = false;

  ngOnChanges(): void {
    // @Input() values land after construction, so the control can't be
    // pre-seeded from currentStatus in a field initializer (it would always
    // see the default ''). Only seed once, so the admin's own selection
    // afterwards isn't clobbered by a later parent re-render.
    if (!this.statusControlTouched && this.currentStatus) {
      this.statusControl.setValue(this.currentStatus);
      this.statusControlTouched = true;
    }
  }

  confirmChange(): void {
    this.statusChange.emit(this.statusControl.value);
    this.confirmOpen.set(false);
  }
}
