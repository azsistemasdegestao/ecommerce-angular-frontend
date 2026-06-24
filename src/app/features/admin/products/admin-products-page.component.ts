import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminProductService } from './admin-product.service';
import { AdminProductTableComponent } from './components/admin-product-table.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { ButtonComponent } from '../../../shared/button/button.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-admin-products-page',
  imports: [RouterLink, AdminProductTableComponent, PaginationComponent, ButtonComponent, ModalComponent],
  template: `
    <div>
      <div class="mb-4 flex justify-end">
        <a routerLink="/admin/products/new">
          <app-button>New product</app-button>
        </a>
      </div>

      @if (!adminProductService.isLoading() && adminProductService.products().length === 0) {
        <div class="flex flex-col items-center gap-4 py-12 text-center">
          <p class="text-graphite-muted">No products registered yet.</p>
          <a routerLink="/admin/products/new">
            <app-button>Create first product</app-button>
          </a>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <app-admin-product-table
            [products]="adminProductService.products()"
            (deleteProduct)="onDeleteRequest($event)"
          />
        </div>

        <div class="mt-4">
          <app-pagination
            [page]="adminProductService.pageNumber()"
            [pageSize]="20"
            [totalItems]="adminProductService.totalCount()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      }

      <app-modal
        [open]="deleteCandidateId() !== null"
        title="Delete product"
        confirmLabel="Delete"
        (confirm)="confirmDelete()"
        (cancel)="deleteCandidateId.set(null)"
      >
        Are you sure you want to delete this product? It will be hidden from the storefront.
      </app-modal>
    </div>
  `,
})
export class AdminProductsPageComponent implements OnInit {
  protected readonly adminProductService = inject(AdminProductService);
  private readonly toastService = inject(ToastService);

  protected readonly deleteCandidateId = signal<string | null>(null);

  ngOnInit(): void {
    void this.adminProductService.loadProducts();
  }

  onPageChange(page: number): void {
    void this.adminProductService.loadProducts(page);
  }

  onDeleteRequest(id: string): void {
    this.deleteCandidateId.set(id);
  }

  async confirmDelete(): Promise<void> {
    const id = this.deleteCandidateId();
    if (!id) return;
    try {
      await this.adminProductService.delete(id);
      this.toastService.show('success', 'Product deleted.');
    } catch {
      this.toastService.show('error', 'Could not delete the product.');
    } finally {
      this.deleteCandidateId.set(null);
    }
  }
}
