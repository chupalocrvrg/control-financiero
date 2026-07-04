import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Penny Drop Algorithm
 * Distributes a total amount into a specific number of installments,
 * ensuring that the sum of the installments exactly equals the total amount.
 * The remainder (if any) is added to the last installment.
 */
export function calculateInstallments(totalNeto: number, meses: number): number[] {
  if (meses <= 0) return [];
  if (meses === 1) return [Math.round(totalNeto * 100) / 100];

  // Calculate base installment rounded to 2 decimals
  const base = Math.round((totalNeto / meses) * 100) / 100;
  const installments = Array(meses).fill(base);
  
  // Calculate the sum of all base installments
  const currentTotal = Math.round((base * meses) * 100) / 100;
  
  // Calculate the remainder
  const remainder = Math.round((totalNeto - currentTotal) * 100) / 100;
  
  // Add the remainder to the last installment
  installments[meses - 1] = Math.round((installments[meses - 1] + remainder) * 100) / 100;
  
  return installments;
}

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (e) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function generateCheckNumber(baseNumber: string, index: number): string {
  if (!baseNumber) return '';
  const num = parseInt(baseNumber, 10);
  if (isNaN(num)) return `${baseNumber}-${index + 1}`;
  return (num + index).toString().padStart(baseNumber.length, '0');
}
