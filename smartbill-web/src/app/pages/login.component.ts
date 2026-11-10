import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/api.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <form class="card auth-card" (ngSubmit)="submit()">
        <div class="brand big">Smart<span>Bill</span></div>
        <p class="muted" style="margin: 0">GST billing and inventory for your shop</p>
        @if (error()) { <div class="alert">{{ error() }}</div> }
        <label>Email
          <input name="email" type="email" [(ngModel)]="email" required autocomplete="username">
        </label>
        <label>Password
          <input name="password" type="password" [(ngModel)]="password" required autocomplete="current-password">
        </label>
        <button class="btn btn-primary full" [disabled]="loading()">{{ loading() ? 'Signing in...' : 'Sign in' }}</button>
        <button type="button" class="btn full" (click)="useDemo()">Use demo account</button>
        <p class="small" style="margin: 0">New shop? <a routerLink="/register">Create an account</a></p>
      </form>
    </div>
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected useDemo(): void {
    this.email = 'demo@smartbill.com';
    this.password = 'Demo@1234';
  }

  protected submit(): void {
    if (!this.email || !this.password) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => { this.error.set(errorMessage(err)); this.loading.set(false); }
    });
  }
}