'use client';

export const expenseCategories = ['Compra de Mercadería', 'Alquiler', 'Servicios', 'Librería y Oficina', 'Logística', 'Impuestos', 'Sueldos', 'Marketing', 'Gastos Bancarios', 'Varios'] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];

export type Invoice = {
  id: string;
  provider: string;
  documentNumber: string;
  date: any; // Can be string or Firebase Timestamp
  totalAmount: string;
  description: string;
  // status is now a derived property, not stored in Firestore
  // status: 'Pendiente de pago' | 'Pagada';
  internalStatus: 'Recibida' | 'En Cianbox' | 'Pagada';
  fileUrl: string;
  userId: string;
  registrationDate: any; // Can be string or Firebase Timestamp
  category?: ExpenseCategory;
};

export type Cheque = {
  id: string;
  beneficiary: string;
  chequeNumber: string;
  amount: string;
  dueDate: string;
  status: 'Pendiente' | 'Vencido' | 'Debitado';
  invoiceIds: string[];
  observation: string;
  fileUrl: string;
  type?: 'emitido' | 'tercero'; // Added for v2.0
};

export type Task = {
  id: string;
  title: string;
  assignee: 'Ramiro' | 'Leandro' | 'Milagros';
  dueDate: any; // Can be Date or Firebase Timestamp
  isCompleted: boolean;
  completedAt?: any; // Can be Date or Firebase Timestamp
  creatorId: string;
  creationDate: any; // Can be Date or Firebase Timestamp
};

export const executives = ['Ramiro', 'Leandro', 'Milagros'] as const;
export type Executive = (typeof executives)[number];

export type CalculationRules = {
  applyDiscount: boolean;
  discount: string;
  applyIva: boolean;
  iva: string;
  applyIibb: boolean;
  iibb: string;
  applyInternalTax: boolean;
  internalTax: string;
  applyShipping: boolean;
  shipping: string;
  cashProfit: string;
  listProfit: string;
  financingInterest: string;
};

export type PriceListFile = {
  name: string;
  url: string;
  storagePath: string;
};

export type Provider = {
  id: string;
  name: string;
  salespersonName?: string;
  salespersonPhone?: string;
  salespersonEmail?: string;
  priceLists?: PriceListFile[];
  priceListLink?: string;
  observation?: string;
  
  // v1.0 schema (kept for backward compatibility)
  calculationRules?: CalculationRules;
  
  // v2.0 schema (bimodal calculator)
  ruleset_lista?: CalculationRules;
  ruleset_factura?: CalculationRules;
};

export type StockEnTransito = {
  id: string;
  providerId: string;
  providerName: string;
  items: { description: string; quantity: number }[];
  date: any; // Can be string or Firebase Timestamp
  fileUrl: string;
  status: 'Pendiente' | 'Procesado';
  registrationDate: any;
};

