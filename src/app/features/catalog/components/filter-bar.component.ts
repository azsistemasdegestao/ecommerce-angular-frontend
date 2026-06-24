import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CategoryDto } from '../../../core/api/generated/models/category-dto';
import { CatalogFilters } from '../catalog.service';
import { InputComponent } from '../../../shared/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/select/select.component';

export type FilterBarChange = Pick<
  CatalogFilters,
  'search' | 'category_slug' | 'min_price' | 'max_price' | 'in_stock'
>;

@Component({
  selector: 'app-filter-bar',
  imports: [ReactiveFormsModule, InputComponent, SelectComponent],
  template: `
    <div class="md:hidden">
      <button
        type="button"
        class="mb-2 rounded-md border border-gray-300 px-3 py-2 text-sm"
        (click)="panelOpen.set(!panelOpen())"
      >
        Filters
      </button>
    </div>

    <form
      class="gap-3 md:flex md:flex-row md:items-end md:gap-4"
      [class.hidden]="!panelOpen()"
      [class.flex]="panelOpen()"
      [class.flex-col]="panelOpen()"
      [formGroup]="form"
    >
      <app-input label="Search" formControlName="search" />
      <app-select label="Category" [options]="categoryOptions()" formControlName="category_slug" />
      <app-input label="Min price" type="number" formControlName="min_price" />
      <app-input label="Max price" type="number" formControlName="max_price" />
      <label class="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" formControlName="in_stock" />
        In stock only
      </label>
    </form>
  `,
})
export class FilterBarComponent implements OnChanges {
  @Input() categories: CategoryDto[] = [];
  @Input() filters: CatalogFilters = { page_number: 1, page_size: 20 };
  @Output() filtersChange = new EventEmitter<FilterBarChange>();

  protected readonly panelOpen = signal(false);

  protected readonly categoryOptions = signal<SelectOption[]>([{ value: '', label: 'All categories' }]);

  protected readonly form = new FormBuilder().group({
    search: [''],
    category_slug: [''],
    min_price: [''],
    max_price: [''],
    in_stock: [false],
  });

  constructor() {
    this.form.valueChanges.subscribe((value) => {
      this.filtersChange.emit({
        search: value.search || undefined,
        category_slug: value.category_slug || undefined,
        min_price: value.min_price ? Number(value.min_price) : undefined,
        max_price: value.max_price ? Number(value.max_price) : undefined,
        in_stock: value.in_stock || undefined,
      });
    });
  }

  ngOnChanges(): void {
    this.categoryOptions.set([
      { value: '', label: 'All categories' },
      ...this.categories.map((category) => ({ value: category.slug, label: category.name })),
    ]);
    this.form.patchValue(
      {
        search: this.filters.search ?? '',
        category_slug: this.filters.category_slug ?? '',
        min_price: this.filters.min_price ? String(this.filters.min_price) : '',
        max_price: this.filters.max_price ? String(this.filters.max_price) : '',
        in_stock: this.filters.in_stock ?? false,
      },
      { emitEvent: false },
    );
  }
}
