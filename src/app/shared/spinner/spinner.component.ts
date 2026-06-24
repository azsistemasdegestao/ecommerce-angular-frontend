import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `
    <svg
      class="animate-spin text-current"
      [style.width.px]="size"
      [style.height.px]="size"
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      ></path>
    </svg>
  `,
})
export class SpinnerComponent {
  @Input() size = 20;
}
