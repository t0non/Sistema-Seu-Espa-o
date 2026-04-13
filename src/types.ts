export interface QuoteItem {
  id: string;
  description: string;
  subDescription?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ServiceType {
  id: string;
  name: string;
  defaultFields: string[];
  defaultItems: string[];
}

export interface Quote {
  id?: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  items: QuoteItem[];
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed';
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  createdBy: string;
  customFields: Record<string, string>;
  notes?: string;
}
