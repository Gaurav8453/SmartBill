import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService, errorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { INDIAN_STATES, stateName } from '../core/config';
import { Customer, CustomerInput } from '../core/models';

@Component({
  selector: 'app-customers',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <h1>Customers</h1>
      <button class="btn btn-primary" (click)="openNew()">+ Add customer</button>
    </div>
    @if (error()) { <div class="alert">{{ error() }}</div> }

    @if (showForm()) {
      <form class="card" #f="ngForm" (ngSubmit)="save()">
        <h2>{{ editingId() === null ? 'New customer' : 'Edit customer' }}</h2>
        <div class="grid">
          <label>Name <input name="name" [(ngModel)]="form.name" required></label>
          <label>Phone <input name="phone" [(ngModel)]="form.phone" maxlength="15"></label>
          <label>GSTIN (optional) <input name="gstin" [(ngModel)]="form.gstin" maxlength="15"></label>
          <label>State
            <select name="stateCode" [(ngModel)]="form.stateCode">
              @for (s of states; track s.code) { <option [value]="s.code">{{ s.name }}</option> }
            </select>
          </label>
        </div>
        <div class="actions">
          <button class="btn btn-primary" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving...' : 'Save' }}</button>
          <button type="button" class="btn" (click)="showForm.set(false)">Cancel</button>
        </div>
      </form>
    }

    <div class="card">
      <div class="toolbar">
        <input placeholder="Search by name, phone or GSTIN..." [ngModel]="search()" (ngModelChange)="search.set($event)">
      </div>
      @if (loading()) {
        <p class="muted">Loading...</p>
      } @else if (filtered().length === 0) {
        <p class="muted">No customers found.</p>
      } @else {
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>GSTIN</th><th>State</th><th></th></tr></thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr>
                <td>{{ c.name }}</td>
                <td>{{ c.phone || '-' }}</td>
                <td>{{ c.gstin || '-' }}</td>
                <td>{{ stateName(c.stateCode) }}</td>
                <td class="num"><button class="btn btn-sm" (click)="edit(c)">Edit</button></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class CustomersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  protected readonly states = INDIAN_STATES;
  protected readonly stateName = stateName;
  protected readonly customers = signal<Customer[]>([]);
  protected readonly search = signal('');
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected form: CustomerInput = this.emptyCustomer();

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return q
      ? this.customers().filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.phone ?? '').includes(q) ||
          (c.gstin ?? '').toLowerCase().includes(q))
      : this.customers();
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.getCustomers().subscribe({
      next: list => { this.customers.set(list); this.loading.set(false); },
      error: err => { this.error.set(errorMessage(err)); this.loading.set(false); }
    });
  }

  protected openNew(): void {
    this.form = this.emptyCustomer();
    this.editingId.set(null);
    this.error.set('');
    this.showForm.set(true);
  }

  protected edit(c: Customer): void {
    this.form = { name: c.name, phone: c.phone, gstin: c.gstin, stateCode: c.stateCode };
    this.editingId.set(c.id);
    this.error.set('');
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected save(): void {
    const id = this.editingId();
    const request: Observable<unknown> = id === null
      ? this.api.createCustomer(this.form)
      : this.api.updateCustomer(id, this.form);
    this.saving.set(true);
    this.error.set('');
    request.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.load(); },
      error: err => { this.error.set(errorMessage(err)); this.saving.set(false); }
    });
  }

  private emptyCustomer(): CustomerInput {
    return { name: '', phone: '', gstin: '', stateCode: this.auth.session()?.stateCode ?? '29' };
  }
}