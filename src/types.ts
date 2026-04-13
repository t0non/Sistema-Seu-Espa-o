export interface QuoteItem {
  id: string;
  description: string;
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
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  createdBy: string;
  customFields: Record<string, string>;
  notes?: string;
}
