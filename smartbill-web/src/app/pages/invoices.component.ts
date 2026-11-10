import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { InvoiceListItem } from '../core/models';

@Component({
  selector: 'app-invoices',
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="page-head">
      <h1>Invoices</h1>
      <a class="btn btn-primary" routerLink="/invoices/new">+ New invoice</a>
    </div>
    @if (error()) { <div class="alert">{{ error() }}</div> }

    <div class="card">
      <div class="toolbar">
        <input placeholder="Search by invoice no. or customer..." [ngModel]="search()" (ngModelChange)="search.set($event)">
      </div>
      @if (loading()) {
        <p class="muted">Loading...</p>
      } @else if (filtered().length === 0) {
        <p class="muted">No invoices found.</p>
      } @else {
        <table>
          <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Tax</th><th class="num">Amount</th></tr></thead>
          <tbody>
            @for (inv of filtered(); track inv.id) {
              <tr class="clickable" (click)="open(inv.id)">
                <td><strong>{{ inv.invoiceNo }}</strong></td>
                <td>{{ inv.invoiceDate | date: 'dd MMM yyyy' }}</td>
                <td>{{ inv.customerName ?? 'Walk-in customer' }}</td>
                <td>
                  @if (inv.isInterState) { <span class="badge info">IGST</span> }
                  @else { <span class="badge">CGST + SGST</span> }
                </td>
                <td class="num">{{ inv.grandTotal | currency }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class InvoicesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly invoices = signal<InvoiceListItem[]>([]);
  protected readonly search = signal('');
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return q
      ? this.invoices().filter(i =>
          i.invoiceNo.toLowerCase().includes(q) || (i.customerName ?? '').toLowerCase().includes(q))
      : this.invoices();
  });

  ngOnInit(): void {
    this.api.getInvoices().subscribe({
      next: list => { this.invoices.set(list); this.loading.set(false); },
      error: err => { this.error.set(errorMessage(err)); this.loading.set(false); }
    });
  }

  protected open(id: number): void {
    this.router.navigate(['/invoices', id]);
  }
}