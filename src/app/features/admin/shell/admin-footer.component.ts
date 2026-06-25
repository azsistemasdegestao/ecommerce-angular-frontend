import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-footer',
  template: `
    <footer class="border-t border-cream/10 bg-charcoal px-4 py-4 text-center text-xs text-cream/60 md:px-8">
      © {{ currentYear }} Maison Admin. All rights reserved.
    </footer>
  `,
})
export class AdminFooterComponent {
  protected readonly currentYear = new Date().getFullYear();
}
