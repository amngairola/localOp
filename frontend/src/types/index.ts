export interface Profile {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ReminderStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'DISMISSED';
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
export type BillStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type BillCategory =
  | 'UTILITIES'
  | 'RENT'
  | 'INSURANCE'
  | 'INTERNET'
  | 'PHONE'
  | 'MEDICAL'
  | 'EDUCATION'
  | 'ENTERTAINMENT'
  | 'FOOD'
  | 'TRANSPORT'
  | 'SHOPPING'
  | 'OTHER';

export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'QUARTERLY' | 'WEEKLY' | 'CUSTOM';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAUSED' | 'EXPIRED';

export type ExpenseCategory =
  | 'FOOD'
  | 'GROCERIES'
  | 'TRANSPORT'
  | 'HOUSING'
  | 'UTILITIES'
  | 'ENTERTAINMENT'
  | 'HEALTHCARE'
  | 'EDUCATION'
  | 'SHOPPING'
  | 'RENT'
  | 'INSURANCE'
  | 'SAVINGS'
  | 'INVESTMENT'
  | 'PERSONAL'
  | 'PERSONAL_CARE'
  | 'TRAVEL'
  | 'OTHER';

export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'UPI'
  | 'NET_BANKING'
  | 'WALLET'
  | 'OTHER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type DocumentType =
  | 'PDF'
  | 'IMAGE'
  | 'INVOICE'
  | 'RECEIPT'
  | 'WORD'
  | 'SPREADSHEET'
  | 'TEXT'
  | 'OTHER';
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: ReminderStatus;
  priority: Priority;
  recurrenceType: RecurrenceType;
  recurrenceValue: number | null;
  notifyBefore: number;
  notifiedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  provider: string | null;
  amount: number;
  currency: string;
  dueDate: string;
  paymentDate: string | null;
  category: BillCategory;
  status: BillStatus;
  isRecurring?: boolean;
  billingCycle?: BillingCycle | null;
  isOverdue?: boolean;
  notes: string | null;
  attachmentUrl: string | null;
  attachmentPath?: string | null;
  signedUrl?: string | null;
  invoiceNumber: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillSummary {
  unpaidCount: number;
  unpaidAmount: number;
  overdueCount: number;
  overdueAmount: number;
  paidThisMonthAmount: number;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  provider: string | null;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  startDate: string;
  nextRenewal: string;
  status: SubscriptionStatus;
  category: string | null;
  notes: string | null;
  paymentMethod?: string | null;
  websiteUrl?: string | null;
  isTrial?: boolean;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
  reminderDaysBefore?: number | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  monthlyEquivalentCost?: number;
  isOverdue?: boolean;
  isRenewalUpcoming?: boolean;
  isTrialEndingSoon?: boolean;
  isTrialExpired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionSummary {
  activeCount: number;
  pausedCount: number;
  cancelledCount: number;
  expiredCount: number;
  totalMonthlyCost: number;
  upcomingRenewalsCount: number;
  trialEndingSoonCount: number;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  paymentMethod: PaymentMethod | null;
  merchant?: string | null;
  notes: string | null;
  receiptPath?: string | null;
  receiptUrl?: string | null;
  signedReceiptUrl?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategorySpending {
  category: ExpenseCategory;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface DailySpending {
  date: string;
  amount: number;
  count: number;
}

export interface ExpenseAnalytics {
  currency: string;
  currentMonthTotal: number;
  previousMonthTotal: number;
  momChangeAmount: number;
  momChangePercentage: number;
  averageDailySpending: number;
  categoryBreakdown: CategorySpending[];
  topCategories: CategorySpending[];
  dailyTrends: DailySpending[];
  totalTransactionsCount: number;
}

export interface Budget {
  id: string;
  userId: string;
  month: number;
  year: number;
  amount: number;
  currency: string;
  category: ExpenseCategory | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStatus extends Budget {
  spentAmount: number;
  remainingAmount: number;
  percentageConsumed: number;
  isExceeded: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory =
  | 'IDENTITY'
  | 'EDUCATION'
  | 'EMPLOYMENT'
  | 'FINANCIAL'
  | 'INSURANCE'
  | 'MEDICAL'
  | 'LEGAL'
  | 'PERSONAL'
  | 'OTHER';

export interface Folder {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  category: DocumentCategory;
  type: DocumentType;
  description?: string | null;
  tags: string[];
  folderId?: string | null;
  folder?: { id: string; name: string; color: string } | null;
  billId?: string | null;
  bill?: { id: string; title: string; amount: number; currency: string } | null;
  expenseId?: string | null;
  expense?: { id: string; title: string; amount: number; currency: string } | null;
  subscriptionId?: string | null;
  subscription?: { id: string; name: string; amount: number; currency: string } | null;
  signedUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VaultStats {
  totalDocuments: number;
  totalSizeBytes: number;
  totalFolders: number;
  categoryBreakdown: { category: DocumentCategory; count: number }[];
  typeBreakdown: { type: DocumentType; count: number }[];
}

export interface DashboardSummary {
  totalMonthlyExpenses: number;
  upcomingBillsCount: number;
  upcomingBillsAmount: number;
  pendingTasksCount: number;
  activeSubscriptionsCount: number;
  activeSubscriptionsMonthly: number;
  upcomingRemindersCount: number;
  currency: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  code?: string;
  details?: unknown;
}
