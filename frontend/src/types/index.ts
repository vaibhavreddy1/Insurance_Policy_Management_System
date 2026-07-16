// Shared TypeScript types for the HDFC IPMS frontend

export type Role = 'admin' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  agentCode?: string;
  isActive?: boolean;
  createdAt?: string;
  deactivatedAt?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Nominee {
  name: string;
  relationship: 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Other';
  dateOfBirth: string;
}

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  mobile: string; // Masked in responses
  aadhaar: string; // Masked in responses
  pan?: string; // Masked in responses
  address: Address;
  nominee: Nominee;
  agentId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  _id: string;
  policyNumber: string;
  customerId: string | { _id: string; firstName: string; lastName: string; email: string };
  agentId: string;
  planName: string;
  policyType: 'Term Life' | 'Endowment' | 'ULIP' | 'Whole Life' | 'Money Back';
  sumAssured: number;
  premium: number;
  premiumFrequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
  policyTerm: 10 | 15 | 20 | 25 | 30;
  startDate: string;
  maturityDate: string;
  status: 'Active' | 'Lapsed' | 'Matured' | 'Surrendered' | 'Cancelled';
  remarks?: string;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}
