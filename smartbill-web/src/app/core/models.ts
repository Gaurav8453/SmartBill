export interface AuthResponse {
  token: string;
  fullName: string;
  shopName: string;
  stateCode: string;
}

export interface RegisterRequest {
  shopName: string;
  fullName: string;
  stateCode: string;
  gstin: string;
  email: string;
  password: string;
}

export interface Product {
  id: number;
  name: string;
  hsnCode: string | null;
  unit: string;
  price: number;
  gstRate: number;
  stockQty: number;
  lowStockLevel: number;
  isLowStock: boolean;
}

export interface ProductInput {
  name: string;
  hsnCode: string | null;
  unit: string;
  price: number;
  gstRate: number;
  stockQty: number;
  lowStockLevel: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  gstin: string | null;
  stateCode: string;
}

export interface CustomerInput {
  name: string;
  phone: string | null;
  gstin: string | null;
  stateCode: string;
}

export interface InvoiceListItem {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string | null;
  isInterState: boolean;
  grandTotal: number;
}

export interface InvoiceItem {
  productName: string;
  hsnCode: string | null;
  qty: number;
  price: number;
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
  lineTotal: number;
}

export interface InvoiceDetail {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  isInterState: boolean;
  subTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  customerName: string | null;
  customerPhone: string | null;
  customerGstin: string | null;
  customerStateCode: string | null;
  shopName: string;
  shopGstin: string | null;
  shopAddress: string | null;
  shopPhone: string | null;
  shopStateCode: string;
  items: InvoiceItem[];
}

export interface CreateInvoiceRequest {
  customerId: number | null;
  items: { productId: number; qty: number }[];
}

export interface CreateInvoiceResponse {
  invoiceId: number;
  invoiceNo: string;
  grandTotal: number;
}

export interface Dashboard {
  todaySales: number;
  monthSales: number;
  invoicesThisMonth: number;
  productCount: number;
  lowStockCount: number;
  recentInvoices: InvoiceListItem[];
}