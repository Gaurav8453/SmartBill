import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/api.service';
import { INDIAN_STATES } from '../core/config';
import { RegisterRequest } from '../core/models';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <form class="card auth-card" #f="ngForm" (ngSubmit)="submit()">
        <div class="brand big">Smart<span>Bill</span></div>
        <h2 style="margin: 0">Create your shop account</h2>
        @if (error()) { <div class="alert">{{ error() }}</div> }
        <label>Shop name <input name="shopName" [(ngModel)]="form.shopName" required></label>
        <label>Your name <input name="fullName" [(ngModel)]="form.fullName" required></label>
        <label>State
          <select name="stateCode" [(ngModel)]="form.stateCode">
            @for (s of states; track s.code) { <option [value]="s.code">{{ s.name }}</option> }
          </select>
        </label>
        <label>GSTIN (optional) <input name="gstin" [(ngModel)]="form.gstin" maxlength="15"></label>
        <label>Email <input name="email" type="email" [(ngModel)]="form.email" required email></label>
        <label>Password (min 8 characters)
          <input name="password" type="password" [(ngModel)]="form.password" required minlength="8">
        </label>
        <button class="btn btn-primary full" [disabled]="loading() || f.invalid">
          {{ loading() ? 'Creating account...' : 'Create account' }}
        </button>
        <p class="small" style="margin: 0">Already registered? <a routerLink="/login">Sign in</a></p>
      </form>
    </div>
  `
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly states = INDIAN_STATES;
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected form: RegisterRequest = {
    shopName: '', fullName: '', stateCode: '29', gstin: '', email: '', password: ''
  };

  protected submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => { this.error.set(errorMessage(err)); this.loading.set(false); }
    });
  }
}