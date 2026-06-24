import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ButtonComponent } from '../../../../shared/button/button.component';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-image-uploader',
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col gap-2">
      @if (previewUrl) {
        <img [src]="previewUrl" alt="Product preview" class="h-32 w-32 rounded-md object-cover" />
      }
      <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFileSelected($event)" #fileInput />
      @if (errorMessage()) {
        <p class="text-sm text-red-600" role="alert">{{ errorMessage() }}</p>
      }
      @if (selectedFile()) {
        <app-button [loading]="uploading" (click)="upload()">Upload image</app-button>
      }
    </div>
  `,
})
export class ImageUploaderComponent {
  @Input() previewUrl: string | null = null;
  @Input() uploading = false;
  @Output() fileChosen = new EventEmitter<File>();

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly errorMessage = signal('');

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.errorMessage.set('');
    this.selectedFile.set(null);
    if (!file) return;

    // BR-FE-ADMIN-PRODUCTS-002: mirror the backend's type/size restrictions
    // client-side to avoid an unnecessary network trip for invalid files.
    if (!ALLOWED_TYPES.has(file.type)) {
      this.errorMessage.set('Only JPEG, PNG, or WEBP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      this.errorMessage.set('Image must be 5MB or smaller.');
      return;
    }
    this.selectedFile.set(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (file) {
      this.fileChosen.emit(file);
    }
  }
}
