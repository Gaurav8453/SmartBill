import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { Dashboard } from '../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="page-head">
      <h1>Dashboard</h1>
      <a class="btn btn-primary" routerLink="/invoices/new">+ New invoice</a>
    </div>
    @if (error()) { <div class="alert">{{ error() }}</div> }

    @if (data(); as d) {
      <div class="stats">
        <div class="card stat"><span>Today's sales</span><strong>{{ d.todaySales | currency }}</strong></div>
        <div class="card stat"><span>This month</span><strong>{{ d.monthSales | currency }}</strong></div>
        <div class="card stat"><span>Invoices this month</span><strong>{{ d.invoicesThisMonth }}</strong></div>
        <a class="card stat" [class.warn]="d.lowStockCount > 0" routerLink="/products">
          <span>Low stock items (of {{ d.productCount }} products)</span>
          <strong>{{ d.lowStockCount }}</strong>
        </a>
      </div>

      <div class="card">
        <h2>Recent invoices</h2>
        @if (d.recentInvoices.length === 0) {
          <p class="muted">No invoices yet. <a routerLink="/invoices/new">Create your first invoice</a>.</p>
        } @else {
          <table>
            <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th class="num">Amount</th></tr></thead>
            <tbody>
              @for (inv of d.recentInvoices; track inv.id) {
                <tr class="clickable" (click)="open(inv.id)">
                  <td><strong>{{ inv.invoiceNo }}</strong></td>
                  <td>{{ inv.invoiceDate | date: 'dd MMM yyyy' }}</td>
                  <td>{{ inv.customerName ?? 'Walk-in customer' }}</td>
                  <td class="num">{{ inv.grandTotal | currency }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    } @else if (!error()) {
      <p class="muted">Loading...</p>
    }
  `
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly data = signal<Dashboard | null>(null);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.api.getDashboard().subscribe({
      next: d => this.data.set(d),
      error: err => this.error.set(errorMessage(err))
    });
  }

  protected open(id: number): void {
    this.router.navigate(['/invoices', id]);
  }
}