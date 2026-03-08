
export type DocCategory = 'Sertifikat' | 'Kutipan' | 'Permohonan' | 'Sanggahan' | 'Tolakan' | 'Lainnya';

export interface IntellectualPropertyDoc {
  id: string;
  title: string;
  applicationNumber: string;
  applicant: string;
  category: DocCategory;
  dateFiled: string;
  status: 'Draft' | 'Terdaftar' | 'Ditolak' | 'Dalam Proses';
  description: string;
  fileUrl?: string;
}

export interface Stats {
  total: number;
  byCategory: Record<DocCategory, number>;
  byStatus: Record<string, number>;
}
