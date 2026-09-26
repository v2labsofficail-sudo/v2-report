import {
  DocumentRecord,
  DocumentTemplate,
  OrganizationSettings,
  PaymentStatus,
} from './types';

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const rounded = Math.round(amount);
  return '₹' + rounded.toLocaleString('en-IN');
}

export function formatINRWithDecimals(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function generateBillingPeriodText(startDateStr?: string, endDateStr?: string): string {
  if (!startDateStr || !endDateStr) return '';
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return '';
  }

  const startMonth = start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const endMonth = end.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  if (startMonth === endMonth) {
    return startMonth;
  }

  return `${startMonth} to ${endMonth}`;
}

export function calculatePaymentStatus(total: number, paid: number): PaymentStatus {
  if (total <= 0) return 'PAID';
  if (paid >= total) return 'PAID';
  if (paid > 0 && paid < total) return 'PARTIALLY_PAID';
  return 'PENDING';
}

export function getDeclarationText(status: PaymentStatus, presets?: OrganizationSettings['declarationPresets']): string {
  const p = presets || {
    paid: 'This invoice is issued for the project mentioned above. Payment has been received in full.',
    partially_paid: 'This invoice is issued for the project mentioned above. Partial payment has been received. The remaining balance is payable as stated above.',
    pending: 'This invoice is issued for the project mentioned above. Payment is pending as stated above.',
  };

  switch (status) {
    case 'PAID':
      return p.paid;
    case 'PARTIALLY_PAID':
      return p.partially_paid;
    case 'PENDING':
    case 'OVERDUE':
    case 'CANCELLED':
    default:
      return p.pending;
  }
}

export interface ValidationIssue {
  fieldId: string;
  fieldLabel: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateDocumentSpace(doc: DocumentRecord, template: DocumentTemplate): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Required field validations
  if (!doc.documentNumber || !doc.documentNumber.trim()) {
    issues.push({ fieldId: 'documentNumber', fieldLabel: 'Document Number', message: 'Document number is required.', severity: 'error' });
  }

  if (!doc.clientData?.name || !doc.clientData.name.trim()) {
    issues.push({ fieldId: 'clientName', fieldLabel: 'Client Name', message: 'Client name is required.', severity: 'error' });
  }

  if (!doc.items || doc.items.length === 0) {
    issues.push({ fieldId: 'items', fieldLabel: 'Service Items', message: 'At least one service item is required.', severity: 'error' });
  }

  // Row capacity check
  const maxRowsP1 = template.table?.max_rows_page_1 || (template.type === 'bill' ? 4 : 3);
  if (doc.items && doc.items.length > maxRowsP1) {
    issues.push({
      fieldId: 'items',
      fieldLabel: 'Service Table Capacity',
      message: `Table has ${doc.items.length} items (page 1 capacity is ${maxRowsP1}). An automated Page 2 continuation will be generated.`,
      severity: 'warning',
    });
  }

  // Notes length check for Bill
  if (doc.documentType === 'bill' && doc.notes) {
    const charCount = doc.notes.length;
    if (charCount > 240) {
      issues.push({
        fieldId: 'notes',
        fieldLabel: 'Notes Area',
        message: `Notes text (${charCount} characters) may overflow the fixed notes box. Recommend keeping under 220 characters.`,
        severity: 'warning',
      });
    }
  }

  // Client Name length
  if (doc.clientData?.name && doc.clientData.name.length > 40) {
    issues.push({
      fieldId: 'clientName',
      fieldLabel: 'Client Name',
      message: 'Client name is unusually long and will be truncated/wrapped.',
      severity: 'warning',
    });
  }

  return issues;
}
