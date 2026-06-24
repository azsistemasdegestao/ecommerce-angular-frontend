import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../../../../shared/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/select/select.component';

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export interface AdminOrderFilterChange {
  status?: string;
  user_id?: string;
}

@Component({
  selector: 'app-admin-order-filter-bar',
  imports: [ReactiveFormsModule, InputComponent, SelectComponent],
  template: `
    <form class="flex flex-col gap-4 lg:flex-row lg:items-end" [formGroup]="form">
      <app-select label="Status" [options]="statusOptions" formControlName="status" />
      <app-input label="User ID" formControlName="user_id" />
    </form>
  `,
})
export class AdminOrderFilterBarComponent {
  @Output() filtersChange = new EventEmitter<AdminOrderFilterChange>();

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly form = new FormBuilder().nonNullable.group({
    status: [''],
    user_id: [''],
  });

  constructor() {
    this.form.valueChanges.subscribe((value) => {
      this.filtersChange.emit({
        status: value.status || undefined,
        user_id: value.user_id || undefined,
      });
    });
  }
}
