import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API_URL } from './config';
import {
  CreateInvoiceRequest, CreateInvoiceResponse, Customer, CustomerInput, Dashboard,
  InvoiceDetail, InvoiceListItem, Product, ProductInput
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getDashboard() { return this.http.get<Dashboard>(`${API_URL}/dashboard`); }

  getProducts() { return this.http.get<Product[]>(`${API_URL}/products`); }
  createProduct(body: ProductInput) { return this.http.post<{ id: number }>(`${API_URL}/products`, body); }
  updateProduct(id: number, body: ProductInput) { return this.http.put<void>(`${API_URL}/products/${id}`, body); }
  deleteProduct(id: number) { return this.http.delete<void>(`${API_URL}/products/${id}`); }

  getCustomers() { return this.http.get<Customer[]>(`${API_URL}/customers`); }
  createCustomer(body: CustomerInput) { return this.http.post<{ id: number }>(`${API_URL}/customers`, body); }
  updateCustomer(id: number, body: CustomerInput) { return this.http.put<void>(`${API_URL}/customers/${id}`, body); }

  getInvoices() { return this.http.get<InvoiceListItem[]>(`${API_URL}/invoices`); }
  getInvoice(id: number) { return this.http.get<InvoiceDetail>(`${API_URL}/invoices/${id}`); }
  createInvoice(body: CreateInvoiceRequest) { return this.http.post<CreateInvoiceResponse>(`${API_URL}/invoices`, body); }
}

// Turns any API error into a readable message
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Cannot reach the API. Is SmartBill.Api running on http://localhost:5080?';
    const body = err.error;
    if (body?.error) return String(body.error);
    if (body?.errors) return Object.values(body.errors).flat().join(' ');
    if (body?.title) return String(body.title);
    return `Request failed (${err.status}).`;
  }
  return 'Something went wrong. Please try again.';
}