import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryDto } from '../../../../core/api/generated/models/category-dto';
import { InputComponent } from '../../../../shared/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/select/select.component';
import { ButtonComponent } from '../../../../shared/button/button.component';
import { ModalComponent } from '../../../../shared/modal/modal.component';
import { ToastService } from '../../../../shared/toast/toast.service';
import { AdminCategoryService } from '../../categories/admin-category.service';

export interface ProductFormValue {
  name: string;
  category_id: string;
  price: string;
  stock: string;
  description: string;
  image_url: string;
}

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, InputComponent, SelectComponent, ButtonComponent, ModalComponent],
  template: `
    <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submitForm()">
      <app-input label="Name" formControlName="name" [errorMessage]="fieldError('name')" />
      <div class="flex items-end gap-2">
        <div class="flex-1">
          <app-select label="Category" [options]="categoryOptions" formControlName="category_id" />
        </div>
        <app-button type="button" variant="secondary" (click)="openCategoryModal()">+ New category</app-button>
      </div>
      <app-input label="Price" type="number" formControlName="price" [errorMessage]="fieldError('price')" />
      <app-input label="Stock" type="number" formControlName="stock" [errorMessage]="fieldError('stock')" />
      <app-input label="Image URL" formControlName="image_url" [errorMessage]="fieldError('image_url')" />
      <app-input label="Description" formControlName="description" />
      <app-button type="submit" [loading]="saving">Save</app-button>
    </form>

    <app-modal
      title="New category"
      confirmLabel="Create"
      confirmVariant="primary"
      [open]="showCategoryModal()"
      [confirmLoading]="categoryService.isSaving()"
      (confirm)="submitCategory()"
      (cancel)="closeCategoryModal()"
    >
      <app-input
        label="Name"
        [formControl]="categoryForm.controls.name"
        [errorMessage]="categoryNameError()"
      />
    </app-modal>
  `,
})
export class ProductFormComponent implements OnChanges {
  @Input() categories: CategoryDto[] = [];
  @Input() initialValue: Partial<ProductFormValue> | null = null;
  @Input() saving = false;
  @Input() serverErrors: Record<string, string[]> | null = null;
  @Output() formSubmit = new EventEmitter<ProductFormValue>();

  protected readonly categoryService = inject(AdminCategoryService);
  private readonly toastService = inject(ToastService);

  protected categoryOptions: SelectOption[] = [];
  protected readonly showCategoryModal = signal(false);
  protected readonly categoryServerError = signal('');

  protected readonly form = new FormBuilder().nonNullable.group({
    name: ['', [Validators.required]],
    category_id: ['', [Validators.required]],
    price: ['', [Validators.required]],
    stock: ['', [Validators.required]],
    description: [''],
    image_url: ['', [Validators.required]],
  });

  protected readonly categoryForm = new FormBuilder().nonNullable.group({
    name: ['', [Validators.required]],
  });

  ngOnChanges(): void {
    this.categoryOptions = this.categories.map((c) => ({ value: c.id, label: c.name }));
    if (this.initialValue) {
      this.form.patchValue(this.initialValue);
    }
  }

  protected fieldError(field: string): string {
    const serverError = this.serverErrors?.[field]?.[0];
    if (serverError) return serverError;
    const control = this.form.get(field);
    return control?.touched && control.hasError('required') ? 'This field is required.' : '';
  }

  protected categoryNameError(): string {
    if (this.categoryServerError()) return this.categoryServerError();
    const control = this.categoryForm.controls.name;
    return control.touched && control.hasError('required') ? 'This field is required.' : '';
  }

  protected openCategoryModal(): void {
    this.categoryForm.reset({ name: '' });
    this.categoryServerError.set('');
    this.showCategoryModal.set(true);
  }

  protected closeCategoryModal(): void {
    this.showCategoryModal.set(false);
  }

  protected async submitCategory(): Promise<void> {
    this.categoryForm.markAllAsTouched();
    if (this.categoryForm.invalid) return;

    this.categoryServerError.set('');
    try {
      const created = await this.categoryService.create({
        name: this.categoryForm.getRawValue().name,
        slug: null,
      });
      this.categoryOptions = [...this.categoryOptions, { value: created.id, label: created.name }];
      this.form.controls.category_id.setValue(created.id);
      this.toastService.show('success', 'Category created.');
      this.showCategoryModal.set(false);
    } catch (error) {
      const apiError = error as { status?: number; errors?: Record<string, string[]> };
      const serverMessage = apiError.errors?.['name']?.[0];
      if (apiError.status === 400 && serverMessage) {
        this.categoryServerError.set(serverMessage);
      } else {
        this.toastService.show('error', 'Could not create the category.');
      }
    }
  }

  submitForm(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.formSubmit.emit(this.form.getRawValue());
  }
}
