
export type SecurityClassification = 'Terbuka' | 'Terbatas' | 'Rahasia';
export type DocumentForm = 'Asli' | 'Salinan' | 'Scan';
export type DevelopmentLevel = 'Asli' | 'Copy' | 'Draft';
export type ArchiveCategory = 'Vital' | 'Aktif' | 'Inaktif' | 'Statis';

export type Role = 'SUPERADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface ModulePermission {
  id: string;
  label: string;
  allowed: boolean;
}

export interface RolePermissions {
  role: Role;
  modules: ModulePermission[];
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
  processingUnit?: string;
  avatar: string;
}

export interface IntellectualPropertyDoc {
  id: string;
  fileNumber: string;
  archiveItemNumber: string;
  boxNumber: string;
  classificationCode: string;
  documentForm: DocumentForm;
  name: string;
  applicant?: string;
  inventor?: string;
  creator?: string;
  copyrightHolder?: string;
  consultant?: string;
  archiveType: string;
  archiveDescription: string;
  documentNumber: string;
  documentDate: string;
  archiveCategory: ArchiveCategory;
  securityClassification: SecurityClassification;
  building: string;
  floor: string;
  cabinet: string;
  shelf: string;
  mapOrFolder: string;
  archiveYear: string;
  processingUnit: string;
  retentionPeriod: string;
  additionalNotes: string;
  uploadedBy?: string;
  uploadDate?: string;
  fileUrl?: string;
  ocrText?: string;
}

export interface ArchiveBox {
  id: string;
  boxNumber: string;
  location: string;
  documentIds: string[];
  processingUnit: string;
  yearRange: string;
  createdAt: string;
}

export interface LoanRecord {
  id: string;
  archiveId: string;
  borrowerName: string;
  borrowerNip: string;
  borrowerUnit: string;
  loanDate: string;
  returnDate?: string;
  status: 'Dipinjam' | 'Dikembalikan' | 'Overdue';
  notes: string;
}

export interface Stats {
  total: number;
  byType: Record<string, number>;
  bySecurity: Record<string, number>;
}
