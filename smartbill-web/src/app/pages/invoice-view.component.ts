import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { stateName } from '../core/config';
import { InvoiceDetail } from '../core/models';
import { rupeesInWords } from '../core/rupees-in-words';

@Component({
  selector: 'app-invoice-view',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    @if (error()) { <div class="alert">{{ error() }}</div> }

    @if (invoice(); as inv) {
      <div class="page-head no-print">
        <a routerLink="/invoices">&larr; All invoices</a>
        <div style="display: flex; gap: 8px">
          <a class="btn" [href]="whatsAppLink()" target="_blank" rel="noopener">Share on WhatsApp</a>
          <button class="btn btn-primary" (click)="print()">Print / Save as PDF</button>
        </div>
      </div>

      <div class="card">
        <div class="invoice-head">
          <div>
            <div class="brand big">{{ inv.shopName }}</div>
            @if (inv.shopAddress) { <div>{{ inv.shopAddress }}</div> }
            @if (inv.shopPhone) { <div>Phone: {{ inv.shopPhone }}</div> }
            @if (inv.shopGstin) { <div>GSTIN: <strong>{{ inv.shopGstin }}</strong></div> }
          </div>
          <div style="text-align: right">
            <h1>TAX INVOICE</h1>
            <div>Invoice no: <strong>{{ inv.invoiceNo }}</strong></div>
            <div>Date: {{ inv.invoiceDate | date: 'dd MMM yyyy' }}</div>
            <div>Place of supply: {{ stateName(inv.customerStateCode ?? inv.shopStateCode) }}</div>
          </div>
        </div>

        <div style="margin-bottom: 16px">
          <div class="muted small">BILL TO</div>
          <strong>{{ inv.customerName ?? 'Walk-in customer' }}</strong>
          @if (inv.customerPhone) { <div>Phone: {{ inv.customerPhone }}</div> }
          @if (inv.customerGstin) { <div>GSTIN: {{ inv.customerGstin }}</div> }
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th><th>Item</th><th>HSN</th><th class="num">Qty</th><th class="num">Rate</th>
              <th class="num">Taxable</th><th class="num">GST</th><th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            @for (item of inv.items; track $index) {
              <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ item.productName }}</td>
                <td>{{ item.hsnCode || '-' }}</td>
                <td class="num">{{ item.qty }}</td>
                <td class="num">{{ item.price | currency }}</td>
                <td class="num">{{ item.taxableAmount | currency }}</td>
                <td class="num">{{ item.gstRate }}%<br><span class="muted small">{{ item.gstAmount | currency }}</span></td>
                <td class="num">{{ item.lineTotal | currency }}</td>
              </tr>
            }
          </tbody>
        </table>

        <div class="totals" style="margin-top: 16px">
          <div><span>Taxable amount</span><span>{{ inv.subTotal | currency }}</span></div>
          @if (inv.isInterState) {
            <div><span>IGST</span><span>{{ inv.igst | currency }}</span></div>
          } @else {
            <div><span>CGST</span><span>{{ inv.cgst | currency }}</span></div>
            <div><span>SGST</span><span>{{ inv.sgst | currency }}</span></div>
          }
          <div class="grand"><span>Grand total</span><span>{{ inv.grandTotal | currency }}</span></div>
        </div>
        <p class="words">{{ words() }}</p>
        <p class="muted small">This is a computer-generated invoice.</p>
      </div>
    } @else if (!error()) {
      <p class="muted">Loading...</p>
    }
  `
})
export class InvoiceViewComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly id = input.required<string>();
  protected readonly invoice = signal<InvoiceDetail | null>(null);
  protected readonly error = signal('');
  protected readonly stateName = stateName;

  protected readonly words = computed(() => {
    const inv = this.invoice();
    return inv ? rupeesInWords(inv.grandTotal) : '';
  });

  protected readonly whatsAppLink = computed(() => {
    const inv = this.invoice();
    if (!inv) return '';
    const greeting = inv.customerName ? `Hello ${inv.customerName}` : 'Hello';
    const date = new Date(inv.invoiceDate).toLocaleDateString('en-IN');
    const text = `${greeting}, thank you for shopping at ${inv.shopName}. ` +
      `Invoice ${inv.invoiceNo} dated ${date} for \u20B9${inv.grandTotal.toFixed(2)}.`;
    const digits = (inv.customerPhone ?? '').replace(/\D/g, '').slice(-10);
    const phone = digits.length === 10 ? '91' + digits : '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  });

  ngOnInit(): void {
    const id = Number(this.id());
    if (!Number.isInteger(id)) {
      this.error.set('Invalid invoice id.');
      return;
    }
    this.api.getInvoice(id).subscribe({
      next: inv => this.invoice.set(inv),
      error: err => this.error.set(errorMessage(err))
    });
  }

  protected print(): void {
    window.print();
  }
}