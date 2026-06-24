import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'app-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1">
      @if (label) {
        <label [for]="id" class="text-xs font-medium uppercase tracking-wide text-graphite-muted">{{ label }}</label>
      }
      <input
        [id]="id"
        [type]="type"
        [placeholder]="placeholder"
        [value]="value"
        [disabled]="disabled"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="rounded-sm border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-champagne focus:border-champagne disabled:bg-charcoal/5"
        [class]="borderClass"
      />
      @if (errorMessage) {
        <span class="text-sm text-red-700">{{ errorMessage }}</span>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
  @Input() placeholder = '';
  @Input() errorMessage = '';

  readonly id = `app-input-${nextId++}`;
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

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
  }
}
