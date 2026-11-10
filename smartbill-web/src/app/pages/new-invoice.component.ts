import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService, errorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { round2 } from '../core/config';
import { Customer, Product } from '../core/models';

interface Line {
  productId: number | null;
  qty: number;
}

@Component({
  selector: 'app-new-invoice',
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <div class="page-head">
      <h1>New invoice</h1>
      <a class="btn" routerLink="/invoices">Cancel</a>
    </div>
    @if (error()) { <div class="alert">{{ error() }}</div> }

    <div class="card">
      <div class="grid">
        <label>Customer
          <select [ngModel]="customerId()" (ngModelChange)="customerId.set($event)">
            <option [ngValue]="null">Walk-in customer</option>
            @for (c of customers(); track c.id) {
              <option [ngValue]="c.id">{{ c.name }}{{ c.gstin ? ' - ' + c.gstin : '' }}</option>
            }
          </select>
        </label>
        <div style="align-self: end">
          @if (isInterState()) {
            <span class="badge info">Inter-state sale: IGST applies</span>
          } @else {
            <span class="badge">Same-state sale: CGST + SGST</span>
          }
          <a routerLink="/customers" class="small" style="margin-left: 8px">+ Add customer</a>
        </div>
      </div>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th style="width: 45%">Product</th><th class="num">Qty</th><th class="num">Rate</th>
            <th class="num">GST</th><th class="num">Amount</th><th></th>
          </tr>
        </thead>
        <tbody>
          @for (line of lines(); track $index; let i = $index) {
            <tr>
              <td>
                <select class="full" [ngModel]="line.productId" (ngModelChange)="updateLine(i, { productId: $event })">
                  <option [ngValue]="null" disabled>Select product...</option>
                  @for (p of products(); track p.id) {
                    <option [ngValue]="p.id" [disabled]="isUsedElsewhere(p.id, i)">
                      {{ p.name }} ({{ p.stockQty }} in stock)
                    </option>
                  }
                </select>
                @if (rows()[i].overStock) {
                  <div class="error-text">Only {{ rows()[i].product?.stockQty }} in stock</div>
                }
              </td>
              <td class="num">
                <input type="number" min="1" style="width: 80px" [ngModel]="line.qty" (ngModelChange)="updateLine(i, { qty: $event })">
              </td>
              <td class="num">{{ (rows()[i].product?.price ?? 0) | currency }}</td>
              <td class="num">{{ rows()[i].product ? rows()[i].product!.gstRate + '%' : '-' }}</td>
              <td class="num">{{ rows()[i].total | currency }}</td>
              <td class="num"><button class="btn btn-sm btn-danger" title="Remove" (click)="removeLine(i)">X</button></td>
            </tr>
          }
        </tbody>
      </table>
      <button class="btn btn-sm" style="margin-top: 12px" (click)="addLine()">+ Add item</button>
    </div>

    <div class="card">
      <div class="totals">
        <div><span>Taxable amount</span><span>{{ totals().subTotal | currency }}</span></div>
        @if (isInterState()) {
          <div><span>IGST</span><span>{{ totals().igst | currency }}</span></div>
        } @else {
          <div><span>CGST</span><span>{{ totals().cgst | currency }}</span></div>
          <div><span>SGST</span><span>{{ totals().sgst | currency }}</span></div>
        }
        <div class="grand"><span>Total</span><span>{{ totals().grandTotal | currency }}</span></div>
        <button class="btn btn-primary full" style="margin-top: 12px" [disabled]="!canSave()" (click)="save()">
          {{ saving() ? 'Saving...' : 'Save invoice' }}
        </button>
      </div>
    </div>
  `
})
export class NewInvoiceComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly products = signal<Product[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly customerId = signal<number | null>(null);
  protected readonly lines = signal<Line[]>([{ productId: null, qty: 1 }]);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  private readonly productMap = computed(() => new Map(this.products().map(p => [p.id, p] as const)));

  protected readonly isInterState = computed(() => {
    const id = this.customerId();
    if (id === null) return false;
    const customer = this.customers().find(c => c.id === id);
    const shopState = this.auth.session()?.stateCode;
    return !!customer && !!shopState && customer.stateCode !== shopState;
  });

  protected readonly rows = computed(() => this.lines().map(line => {
    const product = line.productId === null ? undefined : this.productMap().get(line.productId);
    const qty = Number(line.qty) || 0;
    const taxable = product ? round2(qty * product.price) : 0;
    const gst = product ? round2(taxable * product.gstRate / 100) : 0;
    return { product, qty, taxable, gst, total: round2(taxable + gst), overStock: !!product && qty > product.stockQty };
  }));

  protected readonly totals = computed(() => {
    const rows = this.rows();
    const subTotal = round2(rows.reduce((sum, r) => sum + r.taxable, 0));
    const gst = round2(rows.reduce((sum, r) => sum + r.gst, 0));
    const inter = this.isInterState();
    const cgst = inter ? 0 : round2(gst / 2);
    const sgst = inter ? 0 : round2(gst - cgst);
    return { subTotal, cgst, sgst, igst: inter ? gst : 0, grandTotal: round2(subTotal + gst) };
  });

  protected readonly canSave = computed(() => {
    const rows = this.rows();
    return !this.saving()
      && rows.some(r => !!r.product && r.qty > 0)
      && rows.every(r => !r.product || (r.qty > 0 && !r.overStock));
  });

  ngOnInit(): void {
    forkJoin({ products: this.api.getProducts(), customers: this.api.getCustomers() }).subscribe({
      next: ({ products, customers }) => { this.products.set(products); this.customers.set(customers); },
      error: err => this.error.set(errorMessage(err))
    });
  }

  protected addLine(): void {
    this.lines.update(ls => [...ls, { productId: null, qty: 1 }]);
  }

  protected removeLine(index: number): void {
    this.lines.update(ls => ls.length === 1 ? [{ productId: null, qty: 1 }] : ls.filter((_, i) => i !== index));
  }

  protected updateLine(index: number, patch: Partial<Line>): void {
    this.lines.update(ls => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  protected isUsedElsewhere(productId: number, index: number): boolean {
    return this.lines().some((l, i) => i !== index && l.productId === productId);
  }

  protected save(): void {
    if (!this.canSave()) return;
    const items = this.lines()
      .filter(l => l.productId !== null && Number(l.qty) > 0)
      .map(l => ({ productId: l.productId as number, qty: Number(l.qty) }));

    this.saving.set(true);
    this.error.set('');
    this.api.createInvoice({ customerId: this.customerId(), items }).subscribe({
      next: res => this.router.navigate(['/invoices', res.invoiceId]),
      error: err => { this.error.set(errorMessage(err)); this.saving.set(false); }
    });
  }
}