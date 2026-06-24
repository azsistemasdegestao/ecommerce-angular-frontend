import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

let nextId = 0;

@Component({
  selector: 'app-select',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1">
      @if (label) {
        <label [for]="id" class="text-xs font-medium uppercase tracking-wide text-graphite-muted">{{ label }}</label>
      }
      <select
        [id]="id"
        [value]="value"
        [disabled]="disabled"
        (change)="onSelect($event)"
        (blur)="onTouched()"
        class="rounded-sm border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-champagne focus:border-champagne disabled:bg-charcoal/5"
        [class]="borderClass"
      >
        @for (option of options; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
      @if (errorMessage) {
        <span class="text-sm text-red-700">{{ errorMessage }}</span>
      }
    </div>
  `,
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() options: SelectOption[] = [];
  @Input() errorMessage = '';

  readonly id = `app-select-${nextId++}`;
  value = '';
  disabled = false;

  protected get borderClass(): string {
    return this.errorMessage ? 'border-red-500' : 'border-charcoal/20';
  }

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelect(event: Event): void {
    this.value = (event.target as HTMLSelectElement).value;
    this.onChange(this.value);
  }
}
