import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminProductService } from './admin-product.service';
import { CatalogService } from '../../catalog/catalog.service';
import { ProductFormComponent, ProductFormValue } from './components/product-form.component';
import { ImageUploaderComponent } from './components/image-uploader.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-admin-product-edit-page',
  imports: [RouterLink, ProductFormComponent, ImageUploaderComponent],
  template: `
    <div class="max-w-xl p-4 lg:p-6">
      <h1 class="mb-4 text-xl font-semibold">Edit product</h1>

      @if (catalogService.productNotFound()) {
        <p class="text-gray-600">Product not found.</p>
        <a class="text-blue-600 hover:underline" routerLink="/admin/products">Back to products</a>
      } @else if (catalogService.currentProduct(); as product) {
        <app-product-form
          [categories]="catalogService.categories()"
          [initialValue]="{
            name: product.name,
            category_id: product.category.id,
            price: String(product.price),
            stock: String(product.stock),
            description: product.description,
            image_url: product.image_url,
          }"
          [saving]="adminProductService.isSaving()"
          [serverErrors]="serverErrors()"
          (formSubmit)="onSubmit($event)"
        />

        <div class="mt-6">
          <h2 class="mb-2 text-sm font-medium text-gray-700">Product image</h2>
          <app-image-uploader
            [previewUrl]="previewUrl() ?? product.image_url"
            [uploading]="adminProductService.isUploadingImage()"
            (fileChosen)="onImageChosen($event)"
          />
        </div>
      }
    </div>
  `,
})
export class AdminProductEditPageComponent implements OnInit {
  protected readonly adminProductService = inject(AdminProductService);
  protected readonly catalogService = inject(CatalogService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly serverErrors = signal<Record<string, string[]> | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly String = String;

  private productId = '';

  async ngOnInit(): Promise<void> {
    this.productId = this.route.snapshot.paramMap.get('id')!;
    await this.catalogService.loadCategories();

    if (this.adminProductService.products().length === 0) {
      await this.adminProductService.loadProducts(1, 100);
    }
    const match = this.adminProductService.products().find((p) => p.id === this.productId);
    if (match) {
      await this.catalogService.loadProductBySlug(match.slug);
    }
  }

  async onSubmit(value: ProductFormValue): Promise<void> {
    this.serverErrors.set(null);
    try {
      await this.adminProductService.update(this.productId, {
        name: value.name,
        price: Number(value.price),
        stock: Number(value.stock),
        description: value.description,
        image_url: value.image_url,
      });
      this.toastService.show('success', 'Product updated.');
      await this.router.navigateByUrl('/admin/products');
    } catch (error) {
      const apiError = error as { status?: number; errors?: Record<string, string[]> };
      if (apiError.status === 400 && apiError.errors) {
        this.serverErrors.set(apiError.errors);
      } else {
        this.toastService.show('error', 'Could not update the product.');
      }
    }
  }

  async onImageChosen(file: File): Promise<void> {
    try {
      const imageUrl = await this.adminProductService.uploadImage(this.productId, file);
      this.previewUrl.set(imageUrl);
      this.toastService.show('success', 'Image uploaded.');
    } catch {
      this.toastService.show('error', 'Could not upload the image.');
    }
  }
}
