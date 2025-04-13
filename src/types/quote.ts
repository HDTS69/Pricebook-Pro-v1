// Basic type definitions based on usage in PricebookPage.tsx
// Expand these as needed

export interface Addon {
  addonId: string;
  name: string;
  price: number;
}

export interface QuoteTask {
  taskId: string;
  originalServiceId?: string;
  name: string;
  description: string;
  basePrice: number;
  quantity?: number;
  addons?: Addon[];

  // Added metadata fields
  title?: string;
  code?: string;
  category?: string;
  subcategory?: string;
  subSubcategory?: string;
  imageFile?: string;
  configOption?: string;
  priceInclGST?: number;
  time?: number; // Assuming numerical value like hours
  materials?: number; // Assuming numerical cost
  tags?: string[]; // Added tags field
}

export interface Adjustment {
  adjustmentId: string;
  type: 'manual' | 'percentage'; // Example types
  description: string;
  value: number;
  amount: number;
}

export interface Tier {
  id: string;
  name: string;
  multiplier: number;
  warranty: string;
  perks: string[];
}

export interface Quote {
  id: string;
  quoteNumber: string;
  sequenceNumber: number;
  name: string;
  customerId: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Archived' | 'Completed';
  tierTasks: { [tierId: string]: QuoteTask[] };
  selectedTierId: string | null; // Allow null if no tier selected
  adjustments: Adjustment[];
  totalPrice: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  sentAt?: string; // Optional ISO date string
  acceptedAt?: string; // Optional ISO date string
}

export interface Address {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
}

export interface Customer {
  id: string;                 // Corresponds to ServiceM8 UUID
  name: string;               // Company Name or Primary Contact Name
  email?: string | null;
  phone?: string | null;        // Primary landline or office phone
  mobile_phone?: string | null; // Mobile phone number
  billing_address?: Address | null; // Structured billing address
  // Potential read-only fields from ServiceM8 (optional)
  // active?: boolean;
  // edit_date?: string; // ISO Date
  // creation_date?: string; // ISO Date
} 