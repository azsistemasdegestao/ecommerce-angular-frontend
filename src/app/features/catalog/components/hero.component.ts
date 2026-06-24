import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  template: `
    <section class="relative isolate flex min-h-[50vh] items-center justify-center overflow-hidden md:min-h-[70vh]">
      <div class="absolute inset-0 -z-10 bg-gradient-to-br from-charcoal via-charcoal to-[#3a2f1f]"></div>
      <div class="absolute inset-0 bg-black/30"></div>

      <div class="relative z-10 flex max-w-2xl flex-col items-center gap-6 px-6 text-center">
        <p class="text-xs uppercase tracking-widest text-cream/70">New season</p>
        <h1 class="font-display text-4xl italic leading-tight text-cream md:text-6xl lg:text-7xl">
          Timeless pieces, curated for you
        </h1>
        <p class="font-sans text-sm text-cream/80 md:text-base">
          Discover a collection crafted with quality and quiet elegance.
        </p>
        <a
          routerLink="/"
          class="mt-2 inline-block border border-cream/60 px-8 py-3 text-sm uppercase tracking-widest text-cream transition-colors duration-300 hover:bg-cream hover:text-charcoal"
        >
          Explore the collection
        </a>
      </div>
    </section>
  `,
})
export class HeroComponent {}
