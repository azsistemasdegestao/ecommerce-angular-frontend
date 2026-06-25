import { Component, Input, OnChanges, signal } from '@angular/core';
import * as QRCode from 'qrcode';
import { SpinnerComponent } from '../../../shared/spinner/spinner.component';

@Component({
  selector: 'app-payment-pending-state',
  imports: [SpinnerComponent],
  template: `
    @if (paymentMethod === 'Pix') {
      <div class="flex flex-col items-center gap-4 py-12 text-center">
        @if (qrCodeDataUrl()) {
          <img [src]="qrCodeDataUrl()" alt="Pix QR code" class="h-44 w-44 rounded-sm border border-charcoal/10" />
        } @else {
          <app-spinner [size]="40" />
        }
        <p class="font-display text-lg italic text-charcoal">Scan the Pix QR code to pay</p>
        <div class="w-full max-w-xs break-all rounded-sm border border-charcoal/10 bg-cream p-3 text-xs text-graphite-muted">
          {{ pixCopyPasteCode() }}
        </div>
        <p class="text-xs text-graphite-muted">
          Simulated Pix code for demo purposes only - it cannot be scanned by a real banking app.
        </p>
      </div>
    } @else {
      <div class="flex flex-col items-center gap-4 py-12 text-center">
        <app-spinner [size]="40" />
        <p class="text-graphite-muted">Processing your payment...</p>
      </div>
    }
  `,
})
export class PaymentPendingStateComponent implements OnChanges {
  @Input() paymentMethod: string | null = null;
  @Input() paymentId: string | null = null;

  protected readonly qrCodeDataUrl = signal<string | null>(null);
  protected readonly pixCopyPasteCode = signal('');

  ngOnChanges(): void {
    if (this.paymentMethod !== 'Pix' || !this.paymentId) {
      return;
    }
    const code = `00020126MOCKPIX-${this.paymentId}-${Date.now().toString(36)}`;
    this.pixCopyPasteCode.set(code);
    void QRCode.toDataURL(code, { width: 200, margin: 1 }).then((url) => this.qrCodeDataUrl.set(url));
  }
}
