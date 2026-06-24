import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-hero',
  template: `
    <section
      class="relative isolate flex h-[120px] items-center overflow-hidden px-4 sm:h-[140px] md:h-[160px] md:px-8"
    >
      <div class="absolute inset-0 -z-10 bg-gradient-to-br from-charcoal via-charcoal to-[#3a2f1f]"></div>
      <div class="absolute inset-0 bg-black/30"></div>
      <h1 class="relative z-10 font-display text-2xl italic text-cream sm:text-3xl md:text-4xl">
        {{ title }}
      </h1>
    </section>
  `,
})
export class AdminHeroComponent {
  @Input() title = '';
}
