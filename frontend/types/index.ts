// User types
export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Account types
export type AccountType = 'CASH' | 'BANK' | 'E_WALLET' | 'INVESTMENT' | 'CREDIT_CARD' | 'CRYPTO_WALLET' | 'OTHER';

export interface Account {
  id: number;
  userId: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// Category types
export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export interface Transaction {
  id: number;
  accountId: number;
  categoryId: number;
  amount: number;
  description?: string;
  executionDate: string;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  category?: Category;
}

// Budget types
export interface Budget {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

// Loan types
export type LoanStatus = 'ACTIVE' | 'PAID_OFF' | 'DEFAULTED';

export interface Loan {
  id: number;
  userId: number;
  lender?: string;
  principal: number;
  interestRate?: number;
  startDate?: string;
  endDate?: string;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

// Recurring Transaction types
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringTransaction {
  id: number;
  userId: number;
  accountId: number;
  categoryId: number;
  amount: number;
  description?: string;
  frequency: Frequency;
  nextDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  category?: Category;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Notification types
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  notifyAt: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
