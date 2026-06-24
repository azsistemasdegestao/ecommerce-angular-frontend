import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminProductService } from './admin-product.service';
import { CatalogService } from '../../catalog/catalog.service';
import { ProductFormComponent, ProductFormValue } from './components/product-form.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-admin-product-create-page',
  imports: [ProductFormComponent],
  template: `
    <div class="max-w-xl">
      <app-product-form
        [categories]="catalogService.categories()"
        [saving]="adminProductService.isSaving()"
        [serverErrors]="serverErrors()"
        (formSubmit)="onSubmit($event)"
      />
    </div>
  `,
})
export class AdminProductCreatePageComponent implements OnInit {
  protected readonly adminProductService = inject(AdminProductService);
  protected readonly catalogService = inject(CatalogService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly serverErrors = signal<Record<string, string[]> | null>(null);

  ngOnInit(): void {
    void this.catalogService.loadCategories();
  }

  async onSubmit(value: ProductFormValue): Promise<void> {
    this.serverErrors.set(null);
    try {
      await this.adminProductService.create({
        name: value.name,
        category_id: value.category_id,
        price: Number(value.price),
        stock: Number(value.stock),
        description: value.description,
        image_url: value.image_url,
        slug: null,
      });
      this.toastService.show('success', 'Product created.');
      await this.router.navigateByUrl('/admin/products');
    } catch (error) {
      const apiError = error as { status?: number; errors?: Record<string, string[]> };
      if (apiError.status === 400 && apiError.errors) {
        this.serverErrors.set(apiError.errors);
      } else {
        this.toastService.show('error', 'Could not create the product.');
      }
    }
  }
}
