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
        routerLinkActive="font-semibold text-blue-600"
        [routerLinkActiveOptions]="{ exact: true }"
        class="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
      >
        All
      </a>
      @for (category of categories; track category.id) {
        <a
          [routerLink]="['/categories', category.slug]"
          routerLinkActive="font-semibold text-blue-600"
          class="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
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
