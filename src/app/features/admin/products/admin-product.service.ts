import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getProducts } from '../../../core/api/generated/fn/catalog/get-products';
import { createProduct } from '../../../core/api/generated/fn/catalog/create-product';
import { updateProduct } from '../../../core/api/generated/fn/catalog/update-product';
import { deleteProduct } from '../../../core/api/generated/fn/catalog/delete-product';
import { uploadProductImage } from '../../../core/api/generated/fn/catalog/upload-product-image';
import { ApiConfiguration } from '../../../core/api/generated/api-configuration';
import { ProductSummaryDto } from '../../../core/api/generated/models/product-summary-dto';
import { CreateProductCommand } from '../../../core/api/generated/models/create-product-command';
import { UpdateProductRequest } from '../../../core/api/generated/models/update-product-request';

const MAX_PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  private readonly _products = signal<ProductSummaryDto[]>([]);
  private readonly _totalCount = signal(0);
  private readonly _pageNumber = signal(1);
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _isUploadingImage = signal(false);

  readonly products = this._products.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly pageNumber = this._pageNumber.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly isUploadingImage = this._isUploadingImage.asReadonly();

  async loadProducts(pageNumber = 1, pageSize = 20): Promise<void> {
    this._pageNumber.set(pageNumber);
    this._isLoading.set(true);
    try {
      const resp = await firstValueFrom(
        getProducts(this.http, this.apiConfig.rootUrl, {
          page_number: pageNumber,
          page_size: Math.min(pageSize, MAX_PAGE_SIZE),
        }),
      );
      this._products.set(resp.body!.items);
      this._totalCount.set(Number(resp.body!.total_count));
    } finally {
      this._isLoading.set(false);
    }
  }

  async create(command: CreateProductCommand): Promise<string> {
    this._isSaving.set(true);
    try {
      const resp = await firstValueFrom(createProduct(this.http, this.apiConfig.rootUrl, { body: command }));
      return resp.body!.id;
    } finally {
      this._isSaving.set(false);
    }
  }

  async update(id: string, request: UpdateProductRequest): Promise<void> {
    this._isSaving.set(true);
    try {
      await firstValueFrom(updateProduct(this.http, this.apiConfig.rootUrl, { id, body: request }));
    } finally {
      this._isSaving.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(deleteProduct(this.http, this.apiConfig.rootUrl, { id }));
    this._products.update((products) => products.filter((p) => p.id !== id));
  }

  async uploadImage(id: string, file: File): Promise<string> {
    this._isUploadingImage.set(true);
    try {
      const resp = await firstValueFrom(
        uploadProductImage(this.http, this.apiConfig.rootUrl, { id, body: { file } }),
      );
      return resp.body!.image_url;
    } finally {
      this._isUploadingImage.set(false);
    }
  }
}
