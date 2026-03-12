
export type SecurityClassification = 'Terbuka' | 'Terbatas' | 'Rahasia';
export type DocumentForm = 'Asli' | 'Salinan' | 'Scan';
export type DevelopmentLevel = 'Asli' | 'Copy' | 'Draft';
export type ArchiveCategory = 'Vital' | 'Aktif' | 'Inaktif' | 'Statis';

export type Role = 'SUPERADMIN' | 'UNIT_ADMIN';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  processingUnit?: string; // Only for UNIT_ADMIN
  avatar?: string;
}

export interface IntellectualPropertyDoc {
  id: string;
  // 1. Identitas Arsip
  fileNumber: string; // Nomor Berkas
  archiveItemNumber: string; // Nomor Item Arsip
  boxNumber: string; // No Box
  archiveCategory: ArchiveCategory; // Kategori Arsip
  classificationCode: string; // Kode Klasifikasi Arsip
  documentForm: DocumentForm; // Bentuk Naskah

  // 2. Informasi Arsip
  name: string; // Nama
  nipOrApplicant: string; // NIP / Pemohon
  archiveType: string; // Jenis Arsip
  archiveDescription: string; // Keterangan Arsip
  documentNumber: string; // Nomor Dokumen
  documentDate: string; // Tanggal Dokumen

  // 3. Status Arsip
  developmentLevel: DevelopmentLevel; // Tingkat Perkembangan
  securityClassification: SecurityClassification; // Ket. Klasifikasi Keamanan

  // 4. Lokasi Penyimpanan
  building: string; // Gedung
  floor: string; // Lantai
  cabinet: string; // Lemari
  shelf?: string; // Rak / Shelf
  mapOrFolder: string; // Map / Folder

  // 5. Field Tambahan
  archiveYear: string; // Tahun Arsip
  processingUnit: string; // Unit Pengolah
  retentionPeriod: string; // Retensi Arsip
  additionalNotes?: string; // Keterangan Tambahan

  fileUrl?: string;
  archiveSequence?: string; // No (Legacy support)
  uploadedBy: string; // User ID
}

export interface ArchiveBox {
  id: string;
  boxNumber: string;
  location: string;
  documentIds: string[];
  processingUnit?: string;
  yearRange?: string;
  createdAt: string;
}

export interface Stats {
  total: number;
  byType: Record<string, number>;
  bySecurity: Record<string, number>;
}
