import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService, errorMessage } from '../core/api.service';
import { GST_RATES } from '../core/config';
import { Product, ProductInput } from '../core/models';

function emptyProduct(): ProductInput {
  return { name: '', hsnCode: '', unit: 'pcs', price: 0, gstRate: 18, stockQty: 0, lowStockLevel: 5 };
}

@Component({
  selector: 'app-products',
  imports: [FormsModule, CurrencyPipe],
  template: `
    <div class="page-head">
      <h1>Products</h1>
      <button class="btn btn-primary" (click)="openNew()">+ Add product</button>
    </div>
    @if (error()) { <div class="alert">{{ error() }}</div> }

    @if (showForm()) {
      <form class="card" #f="ngForm" (ngSubmit)="save()">
        <h2>{{ editingId() === null ? 'New product' : 'Edit product' }}</h2>
        <div class="grid">
          <label>Name <input name="name" [(ngModel)]="form.name" required></label>
          <label>HSN code <input name="hsnCode" [(ngModel)]="form.hsnCode"></label>
          <label>Unit <input name="unit" [(ngModel)]="form.unit"></label>
          <label>Price (without GST)
            <input name="price" type="number" min="0" step="0.01" [(ngModel)]="form.price" required>
          </label>
          <label>GST rate
            <select name="gstRate" [(ngModel)]="form.gstRate">
              @for (r of gstRates; track r) { <option [ngValue]="r">{{ r }}%</option> }
            </select>
          </label>
          <label>Stock quantity <input name="stockQty" type="number" min="0" [(ngModel)]="form.stockQty" required></label>
          <label>Low stock alert at <input name="lowStockLevel" type="number" min="0" [(ngModel)]="form.lowStockLevel" required></label>
        </div>
        <div class="actions">
          <button class="btn btn-primary" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving...' : 'Save' }}</button>
          <button type="button" class="btn" (click)="showForm.set(false)">Cancel</button>
        </div>
      </form>
    }

    <div class="card">
      <div class="toolbar">
        <input placeholder="Search by name or HSN..." [ngModel]="search()" (ngModelChange)="search.set($event)">
        <label class="inline">
          <input type="checkbox" [ngModel]="lowOnly()" (ngModelChange)="lowOnly.set($event)"> Low stock only
        </label>
      </div>
      @if (loading()) {
        <p class="muted">Loading...</p>
      } @else if (filtered().length === 0) {
        <p class="muted">No products found.</p>
      } @else {
        <table>
          <thead>
            <tr><th>Name</th><th>HSN</th><th class="num">Price</th><th class="num">GST</th><th class="num">Stock</th><th></th></tr>
          </thead>
          <tbody>
            @for (p of filtered(); track p.id) {
              <tr>
                <td>{{ p.name }}</td>
                <td>{{ p.hsnCode || '-' }}</td>
                <td class="num">{{ p.price | currency }}</td>
                <td class="num">{{ p.gstRate }}%</td>
                <td class="num">
                  {{ p.stockQty }} {{ p.unit }}
                  @if (p.isLowStock) { <span class="badge warn">Low</span> }
                </td>
                <td class="num">
                  <button class="btn btn-sm" (click)="edit(p)">Edit</button>
                  <button class="btn btn-sm btn-danger" (click)="remove(p)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class ProductsComponent implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly gstRates = GST_RATES;
  protected readonly products = signal<Product[]>([]);
  protected readonly search = signal('');
  protected readonly lowOnly = signal(false);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected form: ProductInput = emptyProduct();

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.products().filter(p =>
      (!this.lowOnly() || p.isLowStock) &&
      (!q || p.name.toLowerCase().includes(q) || (p.hsnCode ?? '').toLowerCase().includes(q)));
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.getProducts().subscribe({
      next: list => { this.products.set(list); this.loading.set(false); },
      error: err => { this.error.set(errorMessage(err)); this.loading.set(false); }
    });
  }

  protected openNew(): void {
    this.form = emptyProduct();
    this.editingId.set(null);
    this.error.set('');
    this.showForm.set(true);
  }

  protected edit(p: Product): void {
    this.form = {
      name: p.name, hsnCode: p.hsnCode, unit: p.unit, price: p.price,
      gstRate: p.gstRate, stockQty: p.stockQty, lowStockLevel: p.lowStockLevel
    };
    this.editingId.set(p.id);
    this.error.set('');
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected save(): void {
    const id = this.editingId();
    const request: Observable<unknown> = id === null
      ? this.api.createProduct(this.form)
      : this.api.updateProduct(id, this.form);
    this.saving.set(true);
    this.error.set('');
    request.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.load(); },
      error: err => { this.error.set(errorMessage(err)); this.saving.set(false); }
    });
  }

  protected remove(p: Product): void {
    if (!confirm(`Delete "${p.name}"? Old invoices will keep their copy.`)) return;
    this.api.deleteProduct(p.id).subscribe({
      next: () => this.load(),
      error: err => this.error.set(errorMessage(err))
    });
  }
}