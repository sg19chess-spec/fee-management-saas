// Type-safe mapping functions for Supabase query results
// Converts 'any' types to proper TypeScript interfaces

// Base type for any Supabase result
type SupabaseResult<T> = T | null | undefined;

// Helper function to safely convert any to string
const safeString = (value: any): string => {
  return typeof value === 'string' ? value : '';
};

// Helper function to safely convert any to number
const safeNumber = (value: any): number => {
  return typeof value === 'number' ? value : 0;
};

// Helper function to safely convert any to boolean
const safeBoolean = (value: any): boolean => {
  return typeof value === 'boolean' ? value : false;
};

// Helper function to safely convert any to date string
const safeDateString = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
};

// Helper function to safely get first element from array
const safeFirst = <T>(value: any, defaultValue: T): T => {
  if (Array.isArray(value) && value.length > 0) {
    return value[0] as T;
  }
  return defaultValue;
};

// Helper function to safely map array
const safeMap = <T, R>(array: any, mapper: (item: T) => R, defaultValue: R[] = []): R[] => {
  if (Array.isArray(array)) {
    return array.map(mapper);
  }
  return defaultValue;
};

// ===== STUDENT MAPPERS =====

export interface StudentClass {
  name: string;
  section: string;
}

export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  guardian_phone: string;
  guardian_email: string;
  enrollment_status: string;
  admission_date: string;
  classes: StudentClass;
}

export const mapStudentClass = (data: any): StudentClass => {
  return {
    name: safeString(data?.name),
    section: safeString(data?.section),
  };
};

export const mapStudent = (data: any): Student => {
  return {
    id: safeString(data?.id),
    admission_number: safeString(data?.admission_number),
    first_name: safeString(data?.first_name),
    last_name: safeString(data?.last_name),
    guardian_phone: safeString(data?.guardian_phone),
    guardian_email: safeString(data?.guardian_email),
    enrollment_status: safeString(data?.enrollment_status),
    admission_date: safeDateString(data?.admission_date),
    classes: mapStudentClass(safeFirst(data?.classes, { name: '', section: '' })),
  };
};

export const mapStudents = (data: SupabaseResult<any[]>): Student[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapStudent);
};

// ===== PAYMENT MAPPERS =====

export interface PaymentStudent {
  first_name: string;
  last_name: string;
  admission_number: string;
}

export interface PaymentClass {
  name: string;
  section: string;
}

export interface Payment {
  id: string;
  receipt_number: string;
  paid_amount: number;
  payment_method: string;
  payment_status: string;
  payment_date: string;
  students: PaymentStudent;
  classes: PaymentClass;
}

export const mapPaymentStudent = (data: any): PaymentStudent => {
  return {
    first_name: safeString(data?.first_name),
    last_name: safeString(data?.last_name),
    admission_number: safeString(data?.admission_number),
  };
};

export const mapPaymentClass = (data: any): PaymentClass => {
  return {
    name: safeString(data?.name),
    section: safeString(data?.section),
  };
};

export const mapPayment = (data: any): Payment => {
  return {
    id: safeString(data?.id),
    receipt_number: safeString(data?.receipt_number),
    paid_amount: safeNumber(data?.paid_amount),
    payment_method: safeString(data?.payment_method),
    payment_status: safeString(data?.payment_status),
    payment_date: safeDateString(data?.payment_date),
    students: mapPaymentStudent(safeFirst(data?.students, { first_name: '', last_name: '', admission_number: '' })),
    classes: mapPaymentClass(safeFirst(data?.classes, { name: '', section: '' })),
  };
};

export const mapPayments = (data: SupabaseResult<any[]>): Payment[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapPayment);
};

// ===== CLASS MAPPERS =====

export interface Class {
  id: string;
  name: string;
  section: string;
}

export const mapClass = (data: any): Class => {
  return {
    id: safeString(data?.id),
    name: safeString(data?.name),
    section: safeString(data?.section),
  };
};

export const mapClasses = (data: SupabaseResult<any[]>): Class[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapClass);
};

// ===== FEE ITEM MAPPERS =====

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  outstanding_amount: number;
  paid_amount?: number;
  due_date: string;
  status: string;
  fee_plan_name: string;
}

export const mapFeeItem = (data: any): FeeItem => {
  return {
    id: safeString(data?.id),
    name: safeString(safeFirst(data?.fee_items, { name: '' })?.name),
    amount: safeNumber(data?.outstanding_amount),
    outstanding_amount: safeNumber(data?.outstanding_amount),
    paid_amount: safeNumber(data?.paid_amount),
    due_date: safeDateString(data?.due_date),
    status: safeString(data?.status),
    fee_plan_name: safeString(safeFirst(data?.fee_plans, { name: '' })?.name),
  };
};

export const mapFeeItems = (data: SupabaseResult<any[]>): FeeItem[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapFeeItem);
};

// ===== FEE PLAN MAPPERS =====

export interface FeePlan {
  id: string;
  name: string;
  description?: string;
  academic_year: string;
  total_amount: number;
  discount_percentage?: number;
  discount_amount?: number;
  discount_reason?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const mapFeePlan = (data: any): FeePlan => {
  return {
    id: safeString(data?.id),
    name: safeString(data?.name),
    description: safeString(data?.description),
    academic_year: safeString(data?.academic_year),
    total_amount: safeNumber(data?.total_amount),
    discount_percentage: safeNumber(data?.discount_percentage),
    discount_amount: safeNumber(data?.discount_amount),
    discount_reason: safeString(data?.discount_reason),
    status: safeString(data?.status),
    created_at: safeDateString(data?.created_at),
    updated_at: safeDateString(data?.updated_at),
  };
};

export const mapFeePlans = (data: SupabaseResult<any[]>): FeePlan[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapFeePlan);
};

// ===== PAYMENT FEE ITEM MAPPERS =====

export interface PaymentFeeItem {
  id: string;
  fee_item_name: string;
  original_amount: number;
  paid_amount: number;
  fee_plan_name: string;
}

export const mapPaymentFeeItem = (data: any): PaymentFeeItem => {
  return {
    id: safeString(data?.id),
    fee_item_name: safeString(safeFirst(data?.fee_items, { name: '' })?.name),
    original_amount: safeNumber(data?.paid_amount),
    paid_amount: safeNumber(data?.paid_amount),
    fee_plan_name: safeString(safeFirst(data?.fee_plans, { name: '' })?.name),
  };
};

export const mapPaymentFeeItems = (data: SupabaseResult<any[]>): PaymentFeeItem[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapPaymentFeeItem);
};

// ===== PENDING DUE MAPPERS =====

export interface PendingDue {
  id: string;
  outstanding_amount: number;
  due_date: string;
  status: string;
  students: {
    first_name: string;
    last_name: string;
    admission_number: string;
    guardian_phone: string;
  };
  classes: {
    name: string;
    section: string;
  };
  fee_items: {
    name: string;
  };
}

export const mapPendingDue = (data: any): PendingDue => {
  return {
    id: safeString(data?.id),
    outstanding_amount: safeNumber(data?.outstanding_amount),
    due_date: safeDateString(data?.due_date),
    status: safeString(data?.status),
    students: {
      first_name: safeString(safeFirst(data?.students, { first_name: '' })?.first_name),
      last_name: safeString(safeFirst(data?.students, { last_name: '' })?.last_name),
      admission_number: safeString(safeFirst(data?.students, { admission_number: '' })?.admission_number),
      guardian_phone: safeString(safeFirst(data?.students, { guardian_phone: '' })?.guardian_phone),
    },
    classes: {
      name: safeString(safeFirst(data?.classes, { name: '' })?.name),
      section: safeString(safeFirst(data?.classes, { section: '' })?.section),
    },
    fee_items: {
      name: safeString(safeFirst(data?.fee_items, { name: '' })?.name),
    },
  };
};

export const mapPendingDues = (data: SupabaseResult<any[]>): PendingDue[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapPendingDue);
};

// ===== CHART DATA MAPPERS =====

export interface ChartDataPoint {
  month: string;
  amount: number;
}

export const mapChartDataPoint = (data: any): ChartDataPoint => {
  return {
    month: safeString(data?.month),
    amount: safeNumber(data?.amount),
  };
};

export const mapChartData = (data: SupabaseResult<any[]>): ChartDataPoint[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapChartDataPoint);
};

// ===== INSTITUTION MAPPERS =====

export interface Institution {
  id: string;
  name: string;
  code: string;
  whatsapp_api_key?: string;
  whatsapp_endpoint_url?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_waba_id?: string;
  whatsapp_business_phone?: string;
  whatsapp_webhook_secret?: string;
}

export const mapInstitution = (data: any): Institution => {
  return {
    id: safeString(data?.id),
    name: safeString(data?.name),
    code: safeString(data?.code),
    whatsapp_api_key: safeString(data?.whatsapp_api_key),
    whatsapp_endpoint_url: safeString(data?.whatsapp_endpoint_url),
    whatsapp_phone_number_id: safeString(data?.whatsapp_phone_number_id),
    whatsapp_waba_id: safeString(data?.whatsapp_waba_id),
    whatsapp_business_phone: safeString(data?.whatsapp_business_phone),
    whatsapp_webhook_secret: safeString(data?.whatsapp_webhook_secret),
  };
};

// ===== REMINDER TEMPLATE MAPPERS =====

export interface ReminderTemplate {
  id: string;
  name: string;
  subject: string;
  message: string;
  status: string;
}

export const mapReminderTemplate = (data: any): ReminderTemplate => {
  return {
    id: safeString(data?.id),
    name: safeString(data?.name),
    subject: safeString(data?.subject),
    message: safeString(data?.message),
    status: safeString(data?.status),
  };
};

export const mapReminderTemplates = (data: SupabaseResult<any[]>): ReminderTemplate[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapReminderTemplate);
};

// ===== USER MAPPERS =====

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  institution_id: string;
}

export const mapUser = (data: any): User => {
  return {
    id: safeString(data?.id),
    first_name: safeString(data?.first_name),
    last_name: safeString(data?.last_name),
    email: safeString(data?.email),
    role: safeString(data?.role),
    institution_id: safeString(data?.institution_id),
  };
};

export const mapUsers = (data: SupabaseResult<any[]>): User[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapUser);
};
