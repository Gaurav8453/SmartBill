import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (auth.session(); as s) {
      <header class="topbar">
        <div class="brand">Smart<span>Bill</span></div>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/invoices/new" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">New Invoice</a>
          <a routerLink="/invoices" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Invoices</a>
          <a routerLink="/products" routerLinkActive="active">Products</a>
          <a routerLink="/customers" routerLinkActive="active">Customers</a>
        </nav>
        <div class="user">
          <span>{{ s.shopName }}</span>
          <button class="btn btn-ghost btn-sm" (click)="auth.logout()">Logout</button>
        </div>
      </header>
    }
    <main class="container">
      <router-outlet />
    </main>
  `
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
}