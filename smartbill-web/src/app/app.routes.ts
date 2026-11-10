import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';
import { DashboardComponent } from './pages/dashboard.component';
import { ProductsComponent } from './pages/products.component';
import { CustomersComponent } from './pages/customers.component';
import { InvoicesComponent } from './pages/invoices.component';
import { NewInvoiceComponent } from './pages/new-invoice.component';
import { InvoiceViewComponent } from './pages/invoice-view.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'invoices', component: InvoicesComponent },
      { path: 'invoices/new', component: NewInvoiceComponent },
      { path: 'invoices/:id', component: InvoiceViewComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];