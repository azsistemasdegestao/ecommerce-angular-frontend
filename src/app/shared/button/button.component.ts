import { Component, Input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-charcoal text-cream hover:bg-champagne hover:text-charcoal disabled:bg-charcoal/40 transition-colors duration-300',
  secondary: 'bg-transparent border border-charcoal/30 text-charcoal hover:border-champagne hover:text-champagne disabled:opacity-40 transition-colors duration-300',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300',
  ghost: 'bg-transparent text-graphite-muted hover:bg-charcoal/5 hover:text-charcoal disabled:text-charcoal/30 transition-colors duration-300',
};

@Component({
  selector: 'app-button',
  imports: [SpinnerComponent],
  template: `
    <button
      class="inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium disabled:cursor-not-allowed"
      [class]="variantClasses"
      [type]="type"
      [disabled]="disabled || loading"
    >
      @if (loading) {
        <app-spinner [size]="16" />
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() loading = false;

  protected get variantClasses(): string {
    return VARIANT_CLASSES[this.variant];
  }
}
