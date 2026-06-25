import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  template: `
    <section class="relative isolate flex min-h-[38vh] items-center justify-center overflow-hidden py-12 sm:min-h-[46vh] md:h-[440px] md:min-h-0 md:py-0 lg:h-[520px]">
      <div class="absolute inset-0 -z-10 bg-gradient-to-br from-charcoal via-charcoal to-[#3a2f1f]"></div>
      <div class="absolute inset-0 bg-black/30"></div>

      <div class="relative z-10 flex max-w-2xl flex-col items-center gap-3 px-6 text-center md:gap-6">
        <p class="text-xs uppercase tracking-widest text-cream/70">New season</p>
        <h1 class="font-display text-3xl italic leading-tight text-cream sm:text-4xl md:text-6xl lg:text-7xl">
          Timeless pieces,<br />
          <span>curated for you</span>
        </h1>
        <p class="font-sans text-sm text-cream/80 md:text-base">
          Discover a collection crafted with quality and quiet elegance.
        </p>
        <a
          routerLink="/"
          class="mt-1 inline-block border border-cream/60 px-6 py-2.5 text-sm uppercase tracking-widest text-cream transition-colors duration-300 hover:bg-cream hover:text-charcoal md:mt-2 md:px-8 md:py-3"
        >
          Explore the collection
        </a>
      </div>
    </section>
  `,
})
export class HeroComponent {}
