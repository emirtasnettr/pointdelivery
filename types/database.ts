/**
 * Veritabanı Type Definitions
 */

export type UserRole = 'CANDIDATE' | 'MIDDLEMAN' | 'CONSULTANT' | 'ADMIN' | 'CUSTOMER';

export type ApplicationStatus = 'NEW_APPLICATION' | 'EVALUATION' | 'APPROVED' | 'REJECTED' | 'UPDATE_REQUIRED';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  middleman_id: string | null;
  is_active: boolean | null;
  application_status: ApplicationStatus | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateInfo {
  id: string;
  profile_id: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  date_of_birth: string | null;
  national_id: string | null;
  education_level: string | null;
  experience_years: number;
  skills: string[];
  languages: Array<{ name: string; level: string }>;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  profile_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerInfo {
  id: string;
  profile_id: string;
  authorized_name: string | null; // Yetkili Adı Soyadı
  authorized_phone: string | null; // Yetkili Telefon Numarası
  company_name: string | null; // Firma Ünvanı
  tax_number: string | null; // Vergi Numarası
  tax_office: string | null; // Vergi Dairesi
  company_address: string | null; // Şirket Adresi
  company_phone: string | null; // Şirket Telefon Numarası
  created_at: string;
  updated_at: string;
}

export type JobStatus = 'ACTIVE' | 'APPROVED' | 'CURRENT' | 'PAST' | 'REJECTED';

export interface JobPosting {
  id: string;
  customer_id: string;
  title: string;
  task: string | null;
  description: string | null;
  required_count: number; // Kaç kişiye ihtiyaç var
  city: string | null;
  district: string | null;
  job_type: 'FULL_TIME' | 'PART_TIME' | 'SEASONAL' | null;
  contract_start_date: string | null; // Sözleşme Başlangıç Tarihi (Tam zamanlı için)
  contract_end_date: string | null; // Sözleşme Bitiş Tarihi (Tam zamanlı için)
  part_time_start_date: string | null; // Part-time başlangıç tarihi
  part_time_end_date: string | null; // Part-time bitiş tarihi
  seasonal_period_months: number | null; // Dönemsel işler için ay sayısı (1, 3, 6, 12)
  monthly_budget_per_person: number | null; // Tam zamanlı ve dönemsel için aylık bütçe
  daily_budget_per_person: number | null; // Günlük bütçe (eski kullanım)
  hourly_budget_per_person: number | null; // Part-time için saatlik bütçe
  working_hours: Record<string, { start: string; end: string }> | null; // Part-time için çalışma saatleri
  start_date: string | null; // Personelin ne zaman işe başlaması gerektiği
  status: JobStatus;
  rejection_reason: 'NEW_OFFER' | 'PERSONNEL_SHORTAGE' | null;
  rejected_by: string | null;
  rejected_at: string | null;
  new_offer_monthly_budget_per_person: number | null;
  new_offer_daily_budget_per_person: number | null;
  new_offer_total_without_vat: number | null;
  new_offer_total_with_vat: number | null;
  new_offer_accepted: boolean | null;
  created_at: string;
  updated_at: string;
}

export type JobAssignmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface JobAssignment {
  id: string;
  job_posting_id: string;
  candidate_id: string;
  status: JobAssignmentStatus;
  rejection_reason: string | null;
  assigned_by: string;
  assigned_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  logo_url: string | null;
  site_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface HeroSlider {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
