import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    <nav class="flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        class="rounded-sm px-3 py-1 text-sm text-charcoal transition-colors hover:text-champagne disabled:cursor-not-allowed disabled:text-charcoal/30"
        [disabled]="pageNumber() <= 1"
        (click)="goTo(pageNumber() - 1)"
      >
        Previous
      </button>
      <span class="text-sm text-graphite-muted">Page {{ pageNumber() }} of {{ totalPages() }}</span>
      <button
        class="rounded-sm px-3 py-1 text-sm text-charcoal transition-colors hover:text-champagne disabled:cursor-not-allowed disabled:text-charcoal/30"
        [disabled]="pageNumber() >= totalPages()"
        (click)="goTo(pageNumber() + 1)"
      >
        Next
      </button>
    </nav>
  `,
})
export class PaginationComponent {
  private readonly _pageNumber = signal(1);
  private readonly _pageSize = signal(20);
  private readonly _totalItems = signal(0);

  @Input() set page(value: number) {
    this._pageNumber.set(value);
  }
  @Input() set pageSize(value: number) {
    this._pageSize.set(value);
  }
  @Input() set totalItems(value: number) {
    this._totalItems.set(value);
  }

  @Output() pageChange = new EventEmitter<number>();

  readonly pageNumber = this._pageNumber.asReadonly();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this._totalItems() / this._pageSize())));

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this._pageNumber.set(page);
    this.pageChange.emit(page);
  }
}
