import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryDto } from '../../../core/api/generated/models/category-dto';

@Component({
  selector: 'app-category-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
      <a
        routerLink="/"
        routerLinkActive="text-charcoal border-l-2 border-champagne"
        [routerLinkActiveOptions]="{ exact: true }"
        class="whitespace-nowrap rounded-sm px-3 py-1.5 text-sm text-graphite-muted hover:bg-charcoal/5 hover:text-charcoal"
      >
        All
      </a>
      @for (category of categories; track category.id) {
        <a
          [routerLink]="['/categories', category.slug]"
          routerLinkActive="text-charcoal border-l-2 border-champagne"
          class="whitespace-nowrap rounded-sm px-3 py-1.5 text-sm text-graphite-muted hover:bg-charcoal/5 hover:text-charcoal"
        >
          {{ category.name }}
        </a>
      }
    </nav>
  `,
})
export class CategoryNavComponent {
  @Input() categories: CategoryDto[] = [];
}
