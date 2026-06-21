import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { subDays } from "date-fns"
import type { Invoice, Cheque } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInvoicePaymentDetails = (invoice: Invoice, allCheques: Cheque[]) => {
  if (!invoice || !allCheques) {
    return { totalPaid: 0, isPaid: false, associatedCheques: [] };
  }

  const invoiceTotal = parseFloat(invoice.totalAmount || '0');
  const associatedCheques = allCheques.filter(
    (c) => c.invoiceIds?.includes(invoice.id)
  );
  
  // If internalStatus is 'Pagada', it's a manual override. 
  // It is considered fully paid regardless of associated cheques.
  if (invoice.internalStatus === 'Pagada') {
    return { totalPaid: invoiceTotal, isPaid: true, associatedCheques: associatedCheques };
  }
  
  const totalPaidByCheques = associatedCheques.reduce(
    (sum, cheque) => sum + parseFloat(cheque.amount || '0'),
    0
  );
  
  const isPaid = totalPaidByCheques >= invoiceTotal;

  return { totalPaid: totalPaidByCheques, isPaid, associatedCheques };
};

/**
 * Recursively removes 'undefined' fields from an object or array, converting them to 'null'.
 * This is crucial for Firestore, which throws an error if an 'undefined' payload is saved.
 */
export const sanitizeData = <T extends Record<string, any>>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeData) as unknown as T;
  }
  
  const sanitized: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (obj[key] === undefined) {
        sanitized[key] = null;
      } else {
        sanitized[key] = sanitizeData(obj[key]);
      }
    }
  }
  
  return sanitized as T;
};
