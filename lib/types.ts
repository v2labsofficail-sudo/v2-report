export type DocumentType = 'invoice' | 'bill' | 'quotation' | 'agreement';

export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  contact: string;
  location: string;
  isDefault?: boolean;
}

export interface OrganizationSettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  secondaryLocation?: string;
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  showSignatureDefault: boolean;
  showStampDefault: boolean;
  teamMembers: TeamMember[];
  declarationPresets: {
    paid: string;
    partially_paid: string;
    pending: string;
  };
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  address?: string;
  gstin?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateField {
  field_id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'currency' | 'date' | 'email' | 'phone' | 'textarea' | 'select' | 'multi-select' | 'checkbox' | 'image' | 'signature' | 'stamp' | 'calculated';
  x: number;
  y: number;
  width: number;
  height: number;
  font_family?: string;
  font_size?: number;
  font_weight?: 'normal' | '500' | '600' | 'bold';
  text_color?: string;
  alignment?: 'left' | 'center' | 'right';
  vertical_alignment?: 'top' | 'middle' | 'bottom';
  max_characters?: number;
  overflow_behavior?: 'truncate' | 'wrap' | 'shrink' | 'error';
  required?: boolean;
  default_value?: string;
  formatting?: string;
  section?: string;
}

export interface TableColumn {
  id: string;
  label: string;
  key: string;
  width: number; // width in points/px
  alignment: 'left' | 'center' | 'right';
}

export interface TableConfig {
  x: number;
  y: number;
  width: number;
  header_height: number;
  row_height: number;
  max_rows_page_1: number;
  total_row_height: number;
  columns: TableColumn[];
}

export interface CheckboxItem {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  label_offset_x: number;
  label_offset_y: number;
  font_size: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  description: string;
  canvasWidth: number; // e.g. 595.28 for standard A4
  canvasHeight: number; // e.g. 841.89 for standard A4
  background_image: string; // /templates/invoice-master.png or bill-master.png
  fields: Record<string, TemplateField>;
  table: TableConfig;
  checkboxes?: CheckboxItem[];
  stamp?: { x: number; y: number; width: number; height: number };
  signature?: { x: number; y: number; width: number; height: number };
  declaration_box?: { x: number; y: number; width: number; height: number };
  notes_box?: { x: number; y: number; width: number; height: number };
  footer?: { x: number; y: number; width: number; height: number };
}

export interface DocumentItem {
  id: string;
  srNo: number;
  name: string;
  description?: string;
  duration?: string;
  amount: number;
}

export interface DocumentRecord {
  id: string;
  documentType: DocumentType;
  templateId: string;
  documentNumber: string;
  documentDate: string;
  dueDate?: string;
  billingPeriod?: {
    startDate: string;
    endDate: string;
    displayText: string;
  };
  purpose?: string;
  currency: string;
  clientId: string;
  clientData: {
    name: string;
    companyName?: string;
    email: string;
    phone: string;
    address?: string;
  };
  items: DocumentItem[];
  projectCategories?: string[];
  payment: {
    totalAmount: number;
    amountPaid: number;
    balanceAmount: number;
    currency: string;
    status: PaymentStatus;
  };
  declarationText?: string;
  preparedBy: {
    name: string;
    organization: string;
    email: string;
    contact: string;
    location: string;
  };
  notes?: string;
  showSignature: boolean;
  showStamp: boolean;
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  documentId?: string;
  action: string;
  description: string;
  timestamp: string;
  user: string;
}
