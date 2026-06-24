import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { adminCreateCategory } from '../../../core/api/generated/fn/admin-categories/admin-create-category';
import { ApiConfiguration } from '../../../core/api/generated/api-configuration';
import { CreateCategoryCommand } from '../../../core/api/generated/models/create-category-command';
import { CreateCategoryResponse } from '../../../core/api/generated/models/create-category-response';

@Injectable({ providedIn: 'root' })
export class AdminCategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  private readonly _isSaving = signal(false);
  readonly isSaving = this._isSaving.asReadonly();

  async create(command: CreateCategoryCommand): Promise<CreateCategoryResponse> {
    this._isSaving.set(true);
    try {
      const resp = await firstValueFrom(
        adminCreateCategory(this.http, this.apiConfig.rootUrl, { body: command }),
      );
      return resp.body!;
    } finally {
      this._isSaving.set(false);
    }
  }
}
