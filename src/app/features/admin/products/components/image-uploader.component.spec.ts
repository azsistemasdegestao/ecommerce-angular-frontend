import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ImageUploaderComponent } from './image-uploader.component';

function fileInput(fixture: ComponentFixture<ImageUploaderComponent>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input[type="file"]');
}

function dispatchFile(input: HTMLInputElement, file: File): void {
  // jsdom has no DataTransfer/FileList constructors; a minimal array-like
  // with the FileList shape is enough for the component's `files?.[0]` read.
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change'));
}

describe('ImageUploaderComponent', () => {
  let fixture: ComponentFixture<ImageUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ImageUploaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(ImageUploaderComponent);
    fixture.detectChanges();
  });

  it('AC-FE-ADMINPRODUCTS-U-03: uploading an invalid file type is blocked client-side', () => {
    const file = new File(['x'], 'photo.gif', { type: 'image/gif' });
    dispatchFile(fileInput(fixture), file);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Only JPEG, PNG, or WEBP images are allowed.');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('AC-FE-ADMINPRODUCTS-U-04: uploading a file above 5MB is blocked client-side', () => {
    const bigContent = new Uint8Array(6 * 1024 * 1024);
    const file = new File([bigContent], 'photo.jpg', { type: 'image/jpeg' });
    dispatchFile(fileInput(fixture), file);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Image must be 5MB or smaller.');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('accepts a valid file and shows the upload button', () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    dispatchFile(fileInput(fixture), file);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('button')).not.toBeNull();
  });
});
