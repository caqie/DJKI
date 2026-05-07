import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { GoogleGenAI } from "@google/genai";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import * as XLSX from 'xlsx';
import {
  Download, Printer, FileText, Search, Filter, Plus, Eye, Edit, Trash2,
  Lock, Key, LogOut, User as UserIcon, ShieldCheck, Database, LayoutDashboard,
  QrCode, ScanLine, Archive, X, ListTree, Shield, Building2, Camera, RefreshCw,
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, Clock, MapPin, FolderOpen, ArrowLeft
} from 'lucide-react';

// ======================================================
// TIPE DATA
// ======================================================
export type ArchiveCategory = 'Aktif' | 'Inaktif' | 'Statis' | 'Vital';
export type SecurityClassification = 'Terbuka' | 'Terbatas' | 'Rahasia';
export type DocumentForm = 'Asli' | 'Salinan' | 'Scan';
export type Role = 'SUPERADMIN' | 'UNIT_ADMIN' | 'VIEWER';

export interface Archive {
  id: string;
  fileNumber: string;
  archiveItemNumber: string;
  boxNumber: string;
  classificationCode: string;
  documentForm: DocumentForm;
  name: string;
  nipOrApplicant: string;
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

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  processingUnit?: string;
  avatar: string;
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

// ======================================================
// DATA CONSTANTS
// ======================================================
const DJKI_UNITS = [
  'Sekretariat Direktorat Jenderal',
  'Direktorat Hak Cipta dan Desain Industri',
  'Direktorat Paten, DTLST, dan Rahasia Dagang',
  'Direktorat Merek dan Indikasi Geografis',
  'Direktorat Kerja Sama dan Pemberdayaan KI',
  'Direktorat Teknologi Informasi KI',
  'Direktorat Penyidikan dan Penyelesaian Sengketa'
];

const INITIAL_BOXES: ArchiveBox[] = [
  {
    id: 'box-1',
    boxNumber: 'BOX-2024-001',
    location: 'Gedung A, Lantai 1, Lemari C-01, Rak S-01',
    documentIds: ['1', '2'],
    processingUnit: 'Direktorat Merek dan Indikasi Geografis',
    yearRange: '2023-2024',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'box-2',
    boxNumber: 'BOX-2024-002',
    location: 'Gedung B, Lantai 2, Lemari C-05, Rak S-02',
    documentIds: ['3'],
    processingUnit: 'Sekretariat Direktorat Jenderal',
    yearRange: '2024',
    createdAt: '2024-02-01T00:00:00Z'
  }
];

const EMPTY_ARCHIVE: Archive = {
  id: "",
  fileNumber: "",
  archiveItemNumber: "",
  boxNumber: "",
  classificationCode: "",
  documentForm: "Asli",
  name: "",
  nipOrApplicant: "",
  archiveType: "",
  archiveDescription: "",
  documentNumber: "",
  documentDate: "",
  archiveCategory: "Aktif",
  securityClassification: "Terbuka",
  building: "",
  floor: "",
  cabinet: "",
  shelf: "",
  mapOrFolder: "",
  archiveYear: "",
  processingUnit: "",
  retentionPeriod: "",
  additionalNotes: "",
  ocrText: "",
};

export interface ClassificationCode {
  mainCode: string;
  subCode: string;
  archiveType: string;
  description: string;
  category: string;
}

const CLASSIFICATION_CODES: ClassificationCode[] = [
  // --- FASILITATIF ---
  { mainCode: "PR", subCode: "01.01", archiveType: "Rencana Strategis (Renstra)", description: "Visi, misi, tujuan, sasaran, strategi, kebijakan, program dan kegiatan instansi untuk jangka lima tahun.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "01.02", archiveType: "Trilateral Meeting", description: "Penyelarasan rencana kerja dan anggaran antara Kementerian Keuangan, Bappenas dan Kementerian/Lembaga.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "01.03", archiveType: "Rencana Kerja (Renja)", description: "Dokumen perencanaan tahunan instansi pemerintah.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "01.04", archiveType: "RKA-K/L", description: "Rencana Kerja dan Anggaran Kementerian Negara/Lembaga (Pagu Indikatif, Pagu Anggaran, Pagu Alokasi).", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "02.01", archiveType: "Evaluasi Unit Utama", description: "Laporan hasil evaluasi kinerja pada unit eselon I secara berkala.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "02.02", archiveType: "Evaluasi Kantor Wilayah", description: "Laporan hasil evaluasi kinerja pada kantor wilayah dan unit pelaksana teknis.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "03", archiveType: "LAKIP", description: "Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP/LKjIP) dan dokumen pendukungnya.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "04.01", archiveType: "Laporan Bulanan", description: "Laporan berkala setiap bulan mengenai pelaksanaan program dan anggaran.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "04.02", archiveType: "Laporan Triwulan", description: "Laporan berkala setiap tiga bulan (Triwulan I, II, III, IV).", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "04.04", archiveType: "Laporan Tahunan", description: "Laporan komprehensif atas pelaksanaan tugas selama satu tahun anggaran.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "05.01", archiveType: "Rapat Kerja dengan DPR", description: "Bahan, risalah, and laporan hasil rapat kerja atau dengar pendapat dengan DPR.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "05.02", archiveType: "Rapat Pimpinan (Rapim)", description: "Bahan dan risalah rapat pimpinan kementerian.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "05.03", archiveType: "Rakernas", description: "Rapat Kerja Nasional (Rakernas) Kementerian Hukum dan HAM.", category: "Fasilitatif" },
  { mainCode: "PR", subCode: "06.01", archiveType: "Sidang Kabinet", description: "Bahan dan laporan hasil sidang kabinet paripurna atau terbatas.", category: "Fasilitatif" },

  { mainCode: "OT", subCode: "01.01", archiveType: "Ortala Kementerian", description: "Dokumen mengenai penataan organisasi, struktur, dan tata kerja kementerian.", category: "Fasilitatif" },
  { mainCode: "OT", subCode: "01.02", archiveType: "Ortala Kantor Wilayah", description: "Dokumen penataan organisasi dan tata kerja kantor wilayah dan UPT.", category: "Fasilitatif" },
  { mainCode: "OT", subCode: "02.01", archiveType: "Analisis Jabatan (ANJAB)", description: "Hasil analisis jabatan, analisis beban kerja (ABK), dan evaluasi jabatan.", category: "Fasilitatif" },
  { mainCode: "OT", subCode: "02.02", archiveType: "SOP", description: "Standar Operasional Prosedur (SOP) pelaksanaan tugas dan fungsi.", category: "Fasilitatif" },
  { mainCode: "OT", subCode: "02.03", archiveType: "Peta Proses Bisnis", description: "Dokumen pemetaan proses bisnis instansi.", category: "Fasilitatif" },
  { mainCode: "OT", subCode: "03.01", archiveType: "PMPRB", description: "Penilaian Mandiri Pelaksanaan Reformasi Birokrasi (PMPRB).", category: "Fasilitatif" },
  { mainCode: "OT", subCode: "03.02", archiveType: "Zona Integritas (ZI)", description: "Dokumen pembangunan zona integritas menuju WBK dan WBBM.", category: "Fasilitatif" },
  { mainCode: "OT", subCode: "04.01", archiveType: "Instruksi Menteri", description: "Naskah dinas instruksi menteri terkait tata laksana.", category: "Fasilitatif" },

  { mainCode: "KP", subCode: "01.01", archiveType: "Formasi Pegawai", description: "Usulan dan penetapan formasi kebutuhan pegawai.", category: "Fasilitatif" },
  { mainCode: "KP", subCode: "02.01", archiveType: "Penerimaan Pegawai", description: "Pengumuman, pendaftaran, seleksi, dan pengumuman hasil penerimaan CPNS/PNS.", category: "Fasilitatif" },
  { mainCode: "KP", subCode: "03.01", archiveType: "Ujian Dinas", description: "Penyelenggaraan ujian dinas dan ujian penyesuaian ijazah.", category: "Fasilitatif" },
  { mainCode: "KP", subCode: "04.01", archiveType: "Alih Tugas/Mutasi", description: "Dokumen perpindahan tugas pegawai (internal/eksternal).", category: "Fasilitatif" },
  { mainCode: "KP", subCode: "04.04", archiveType: "Kenaikan Gaji Berkala (KGB)", description: "Proses dan surat pemberitahuan kenaikan gaji berkala.", category: "Fasilitatif" },
  { mainCode: "KP", subCode: "05.01", archiveType: "Sasaran Kinerja Pegawai (SKP)", description: "Penilaian prestasi kerja dan perilaku kerja pegawai tahunan.", category: "Fasilitatif" },
  { mainCode: "KP", subCode: "06.01", archiveType: "Pengembangan Pegawai", description: "Berkas ijin belajar, tugas belajar, dan kursus/pelatihan.", category: "Fasilitatif" },
  { mainCode: "KP", subCode: "07.01", archiveType: "Hukuman Disiplin", description: "Proses pemeriksaan dan penjatuhan hukuman disiplin pegawai.", category: "Fasilitatif" },
  { mainCode: "KP", subCode: "08.01", archiveType: "Izin/Cuti", description: "Surat permohonan dan surat izin/cuti pegawai.", category: "Fasilitatif" },
  { mainCode: "KP", subCode: "09.01", archiveType: "Kesejahteraan/Kesehatan", description: "Dokumen asuransi kesehatan, Taspen, dan cek kesehatan.", category: "Fasilitatif" },
  { mainCode: "KP", subCode: "11.01", archiveType: "Pensiun", description: "Berkas usul penetapan pensiun pegawai (BUP, Janda/Duda).", category: "Fasilitatif" },

  { mainCode: "KU", subCode: "01.01", archiveType: "DIPA", description: "Daftar Isian Pelaksanaan Anggaran dan revisi-revisinya.", category: "Fasilitatif" },
  { mainCode: "KU", subCode: "01.02", archiveType: "Target PNBP", description: "Rencana target dan realisasi Penerimaan Negara Bukan Pajak.", category: "Fasilitatif" },
  { mainCode: "KU", subCode: "01.03", archiveType: "Revisi DIPA", description: "Dokumen proses usulan dan penetapan revisi anggaran.", category: "Fasilitatif" },
  { mainCode: "KU", subCode: "02.01", archiveType: "Hibah", description: "Dokumen administrasi dana hibah (Naskah Perjanjian, Penetapan).", category: "Fasilitatif" },
  { mainCode: "KU", subCode: "02.02", archiveType: "UP/TUP", description: "Uang Persediaan dan Tambahan Uang Persediaan.", category: "Fasilitatif" },
  { mainCode: "KU", subCode: "03.01", archiveType: "SPP/SPM/SP2D", description: "Surat Permintaan Pembayaran, Surat Perintah Membayar, dan SP2D.", category: "Fasilitatif" },
  { mainCode: "KU", subCode: "03.03", archiveType: "LPJ Bendahara", description: "Laporan Pertanggungjawaban Bendahara (Pengeluaran/Penerimaan).", category: "Fasilitatif" },
  { mainCode: "KU", subCode: "04.01", archiveType: "Rekonsiliasi Laporan", description: "Dokumen berita acara rekonsiliasi laporan keuangan.", category: "Fasilitatif" },
  { mainCode: "KU", subCode: "04.03", archiveType: "Tindak Lanjut Temuan BPK", description: "Laporan penyelesaian atas temuan hasil pemeriksaan BPK.", category: "Fasilitatif" },

  { mainCode: "PB", subCode: "01.01", archiveType: "RKBMN", description: "Rencana Kebutuhan Barang Milik Negara (RKBMN).", category: "Fasilitatif" },
  { mainCode: "PB", subCode: "02.01", archiveType: "Pengadaan Barang/Jasa", description: "Dokumen proses lelang, kontrak, dan serah terima pengadaan.", category: "Fasilitatif" },
  { mainCode: "PB", subCode: "03.01", archiveType: "Penggunaan BMN", description: "Surat Keputusan penetapan status penggunaan BMN.", category: "Fasilitatif" },
  { mainCode: "PB", subCode: "03.02", archiveType: "Sertifikasi Tanah", description: "Dokumen sertifikasi dan pengamanan aset tanah BMN.", category: "Fasilitatif" },
  { mainCode: "PB", subCode: "04.01", archiveType: "Inventarisasi BMN", description: "Laporan hasil sensus/inventarisasi BMN.", category: "Fasilitatif" },
  { mainCode: "PB", subCode: "05.02", archiveType: "Penghapusan BMN", description: "Dokumen pemindahtanganan dan penghapusan BMN (Lelang/Hibah).", category: "Fasilitatif" },
  { mainCode: "PB", subCode: "06.01", archiveType: "Pemanfaatan BMN", description: "Dokumen sewa, pinjam pakai, dan KSP BMN.", category: "Fasilitatif" },

  { mainCode: "HH", subCode: "01.01", archiveType: "Siaran Pers", description: "Bahan dan naskah siaran pers/press release.", category: "Fasilitatif" },
  { mainCode: "HH", subCode: "01.02", archiveType: "Liputan/Publikasi", description: "Dokumentasi liputan media dan kliping berita.", category: "Fasilitatif" },
  { mainCode: "HH", subCode: "02.01", archiveType: "Pameran", description: "Dokumen penyelenggaraan pameran dan expo.", category: "Fasilitatif" },
  { mainCode: "HH", subCode: "03.01", archiveType: "Kunjungan Luar Negeri", description: "Bahan dan laporan kunjungan tamu asing.", category: "Fasilitatif" },
  { mainCode: "HH", subCode: "04.01", archiveType: "Kerja Sama", description: "Naskah MoU dan PKS dengan instansi pemerintah/swasta.", category: "Fasilitatif" },
  { mainCode: "HH", subCode: "05.01", archiveType: "Advokasi Hukum", description: "Pendampingan hukum kasus perdata, tata usaha negara, dan pidana.", category: "Fasilitatif" },

  { mainCode: "UM", subCode: "01.01", archiveType: "Persuratan", description: "Pengelolaan surat masuk dan surat keluar.", category: "Fasilitatif" },
  { mainCode: "UM", subCode: "02.01", archiveType: "Pengelolaan Arsip", description: "Daftar arsip aktif, inaktif, dan berita acara pemindahan.", category: "Fasilitatif" },
  { mainCode: "UM", subCode: "02.02", archiveType: "Pemusnahan Arsip", description: "Berita acara dan daftar arsip yang dimusnahkan.", category: "Fasilitatif" },
  { mainCode: "UM", subCode: "03.01", archiveType: "Gedung/Tanah", description: "Dokumen pemeliharaan gedung dan aset tanah dinas.", category: "Fasilitatif" },
  { mainCode: "UM", subCode: "03.02", archiveType: "Kendaraan Dinas", description: "Riwayat pemeliharaan dan dokumen kendaraan dinas.", category: "Fasilitatif" },
  { mainCode: "UM", subCode: "04.01", archiveType: "Protokoler", description: "Penyelenggaraan upacara, pelantikan, dan kunjungan tamu pimpinan.", category: "Fasilitatif" },
  { mainCode: "UM", subCode: "05.01", archiveType: "Keamanan Dalam", description: "Laporan harian keamanan dan pengamanan fisik kantor.", category: "Fasilitatif" },

  { mainCode: "PW", subCode: "01.01", archiveType: "PKPT", description: "Program Kerja Pengawasan Tahunan ITJEN.", category: "Fasilitatif" },
  { mainCode: "PW", subCode: "02.01", archiveType: "Audit", description: "Kertas Kerja Pemeriksaan (KKP) dan proses audit.", category: "Fasilitatif" },
  { mainCode: "PW", subCode: "02.02", archiveType: "Monitoring/Review", description: "Pemantauan tindak lanjut dan review laporan.", category: "Fasilitatif" },
  { mainCode: "PW", subCode: "03.01", archiveType: "Laporan Hasil Audit", description: "LHA, LHP, dan laporan pemantauan pengawasan.", category: "Fasilitatif" },
  { mainCode: "PW", subCode: "06.01", archiveType: "WBS", description: "Pengelolaan Whistle Blowing System.", category: "Fasilitatif" },

  { mainCode: "TI", subCode: "01.01", archiveType: "Keamanan Data", description: "Standardisasi backup data and manajemen keamanan informasi.", category: "Fasilitatif" },
  { mainCode: "TI", subCode: "01.02", archiveType: "Disaster Recovery", description: "Dokumen rencana dan pelaksanaan pemulihan data pasca bencana.", category: "Fasilitatif" },
  { mainCode: "TI", subCode: "02.01", archiveType: "Infrastruktur Jaringan", description: "Pengelolaan jaringan LAN/WAN dan server internet.", category: "Fasilitatif" },
  { mainCode: "TI", subCode: "03.01", archiveType: "Aplikasi", description: "Dokumen pengembangan dan pemeliharaan aplikasi sistem informasi.", category: "Fasilitatif" },

  { mainCode: "PP", subCode: "01.01", archiveType: "Perancangan RUU", description: "Dokumen penyusunan Rancangan Undang-Undang.", category: "Substantif" },
  { mainCode: "PP", subCode: "01.04", archiveType: "Perancangan Rpermen", description: "Dokumen penyusunan Rancangan Peraturan Menteri.", category: "Substantif" },
  { mainCode: "PP", subCode: "02.01", archiveType: "Harmonisasi", description: "Berita acara and laporan hasil harmonisasi regulasi.", category: "Substantif" },
  { mainCode: "PP", subCode: "05.01", archiveType: "Dokumentasi Hukum", description: "Pengelolaan basis data produk hukum.", category: "Substantif" },

  { mainCode: "AH", subCode: "01.01", archiveType: "Pengesahan PT", description: "Berkas permohonan and surat keputusan pengesahan PT.", category: "Substantif" },
  { mainCode: "AH", subCode: "01.29", archiveType: "Badan Hukum Koperasi", description: "Proses pengesahan and perubahan anggaran dasar koperasi.", category: "Substantif" },
  { mainCode: "AH", subCode: "02.01", archiveType: "Notariat", description: "Pengangkatan, perpindahan, and cuti Notaris.", category: "Substantif" },
  { mainCode: "AH", subCode: "03.01", archiveType: "Legalisasi", description: "Layanan legalisasi tanda tangan pejabat publik.", category: "Substantif" },
  { mainCode: "AH", subCode: "05.01", archiveType: "Fidusia", description: "Pendaftaran, perubahan, and pencoretan jaminan fidusia.", category: "Substantif" },
  { mainCode: "AH", subCode: "11.01", archiveType: "Balai Harta Peninggalan", description: "Pengurusan boedel warisan dan perwalian.", category: "Substantif" },

  { mainCode: "PK", subCode: "01.01", archiveType: "Registrasi Tahanan", description: "Dokumen pendaftaran and buku register tahanan.", category: "Substantif" },
  { mainCode: "PK", subCode: "05.01", archiveType: "Remisi", description: "Usulan and SK pemberian remisi narapidana.", category: "Substantif" },
  { mainCode: "PK", subCode: "05.02", archiveType: "Integrasi (PB/CB)", description: "Pembebasan Bersyarat, Cuti Menjelang Bebas, Cuti Bersyarat.", category: "Substantif" },
  { mainCode: "PK", subCode: "07.01", archiveType: "Basan Baran", description: "Pengelolaan Benda Sitaan (Basan) dan Barang Rampasan (Baran).", category: "Substantif" },

  { mainCode: "GR", subCode: "01.01", archiveType: "Paspor RI", description: "Berkas permohonan and penerbitan Paspor Republik Indonesia.", category: "Substantif" },
  { mainCode: "GR", subCode: "01.02", archiveType: "Visa", description: "Berkas permohonan and persetujuan Visa kunjungan/tinggal terbatas.", category: "Substantif" },
  { mainCode: "GR", subCode: "02.01", archiveType: "Izin Tinggal", description: "ITK, ITAS, and ITAP bagi warga negara asing.", category: "Substantif" },
  { mainCode: "GR", subCode: "03.01", archiveType: "Pendeportasian", description: "Dokumen tindakan administratif keimigrasian berupa deportasi.", category: "Substantif" },
  { mainCode: "GR", subCode: "04.01", archiveType: "Intelijen Keimigrasian", description: "Dokumen penyelidikan dan intelijen keimigrasian.", category: "Substantif" },

  { mainCode: "KI", subCode: "01.01.01", archiveType: "Pendaftaran Hak Cipta", description: "Permohonan pencatatan ciptaan, buku, seni, musik, dll.", category: "Substantif" },
  { mainCode: "KI", subCode: "01.02.04", archiveType: "Pengalihan Hak Cipta", description: "Pencatatan pengalihan hak ekonomi atas ciptaan.", category: "Substantif" },
  { mainCode: "KI", subCode: "05.01.01", archiveType: "Permohonan Paten", description: "Permohonan paten/paten sederhana dari pendaftaran hingga pemberian.", category: "Substantif" },
  { mainCode: "KI", subCode: "05.04.01", archiveType: "Pemeliharaan Paten", description: "Dokumen pembayaran biaya tahunan paten.", category: "Substantif" },
  { mainCode: "KI", subCode: "06.01.01", archiveType: "Pendaftaran Merek", description: "Permohonan pendaftaran merek dagang, jasa, and kolektif.", category: "Substantif" },
  { mainCode: "KI", subCode: "06.01.10", archiveType: "Sertifikat Merek", description: "Bukti otentik pendaftaran merek terdaftar.", category: "Substantif" },
  { mainCode: "KI", subCode: "06.05.01", archiveType: "Penghapusan Merek", description: "Proses pembatalan atau penghapusan merek terdaftar.", category: "Substantif" },
  { mainCode: "KI", subCode: "06.09.01", archiveType: "Perpanjangan Merek", description: "Berkas perpanjangan masa perlindungan merek (10 tahun).", category: "Substantif" },
  { mainCode: "KI", subCode: "08.01", archiveType: "Penyidikan (PPNS)", description: "BAP and berkas perkara tindak pidana kekayaan intelektual.", category: "Substantif" },

  { mainCode: "HA", subCode: "01.01", archiveType: "Yankomas", description: "Penanganan dugaan pelanggaran HAM yang disampaikan masyarakat.", category: "Substantif" },
  { mainCode: "HA", subCode: "02.01", archiveType: "Kerja Sama HAM", description: "Dokumen kerja sama internasional di bidang HAM.", category: "Substantif" },
  { mainCode: "HA", subCode: "04.01", archiveType: "Instrumen HAM", description: "Analisis and evaluasi peraturan perundang-undangan perspektif HAM.", category: "Substantif" },

  { mainCode: "HN", subCode: "01.01", archiveType: "Analisis Hukum", description: "Hasil evaluasi and analisis hukum nasional.", category: "Substantif" },
  { mainCode: "HN", subCode: "03.01", archiveType: "JDIH", description: "Pengelolaan Jaringan Dokumentasi dan Informasi Hukum.", category: "Substantif" },
  { mainCode: "HN", subCode: "04.01", archiveType: "Penyuluhan Hukum", description: "Dokumen kegiatan sosialisasi and penyuluhan hukum.", category: "Substantif" },

  { mainCode: "SM", subCode: "01.01", archiveType: "Diklat Pim", description: "Penyelenggaraan pelatihan kepemimpinan tingkat I, II, III, IV.", category: "Substantif" },
  { mainCode: "SM", subCode: "03.01", archiveType: "Diklat Fungsional", description: "Program pengembangan kompetensi jabatan fungsional.", category: "Substantif" },
  { mainCode: "SM", subCode: "06.01", archiveType: "Assessment Center", description: "Hasil penilaian kompetensi manajerial and teknis pegawai.", category: "Substantif" },

  { mainCode: "LT", subCode: "01.01", archiveType: "Penelitian Hukum", description: "Laporan akhir hasil penelitian di bidang hukum.", category: "Substantif" },
  { mainCode: "LT", subCode: "02.01", archiveType: "Penelitian HAM", description: "Laporan akhir hasil penelitian di bidang hak asasi manusia.", category: "Substantif" },
  { mainCode: "LT", subCode: "03.01", archiveType: "Evaluasi Kebijakan", description: "Laporan hasil evaluasi pelaksanaan kebijakan kementerian.", category: "Substantif" },
];



const INITIAL_DOCS: Archive[] = [
  {
    id: '1',
    fileNumber: 'F-2023-001',
    archiveItemNumber: 'ITEM-01',
    boxNumber: 'BOX-2024-001',
    archiveCategory: 'Aktif',
    classificationCode: 'HK.01.01',
    documentForm: 'Asli',
    name: 'PT Kenangan Abadi',
    nipOrApplicant: 'Kopi Kenangan',
    archiveType: 'Sertifikat',
    archiveDescription: 'Sertifikat Merek Kopi Kenangan Kelas 30',
    documentNumber: 'IDM000987654',
    documentDate: '2023-11-12',
    securityClassification: 'Terbuka',
    building: 'Gedung A',
    floor: '1',
    cabinet: 'C-01',
    shelf: 'S-01',
    mapOrFolder: 'MAP-01',
    archiveYear: '2023',
    processingUnit: 'Direktorat Merek dan Indikasi Geografis',
    retentionPeriod: '10 Tahun',
    additionalNotes: '',
    uploadedBy: 'admin-merek',
    uploadDate: '2023-11-12T08:00:00Z',
    ocrText: 'REPUBLIK INDONESIA DIREKTORAT JENDERAL KEKAYAAN INTELEKTUAL. Sertifikat Merek ini diberikan kepada PT Kenangan Abadi untuk Merek Kopi Kenangan dengan nomor pendaftaran IDM000987654. Produk: Biji Kopi panggang, minuman kopi, kopi bubuk.'
  },
  {
    id: '2',
    fileNumber: 'F-2024-002',
    archiveItemNumber: 'ITEM-02',
    boxNumber: 'BOX-2024-001',
    archiveCategory: 'Vital',
    classificationCode: 'PT.02.03',
    documentForm: 'Salinan',
    name: 'Universitas Indonesia',
    nipOrApplicant: 'UI Research',
    archiveType: 'Permohonan',
    archiveDescription: 'Permohonan Paten Sistem Filtrasi Limbah Cair',
    documentNumber: 'P00202301234',
    documentDate: '2024-01-20',
    securityClassification: 'Terbatas',
    building: 'Gedung A',
    floor: '1',
    cabinet: 'C-01',
    shelf: 'S-01',
    mapOrFolder: 'MAP-02',
    archiveYear: '2024',
    processingUnit: 'Direktorat Paten, DTLST, dan Rahasia Dagang',
    retentionPeriod: '20 Tahun',
    additionalNotes: '',
    uploadedBy: 'admin-paten',
    uploadDate: '2024-01-20T09:00:00Z'
  },
  {
    id: '3',
    fileNumber: 'F-2024-003',
    archiveItemNumber: 'ITEM-03',
    boxNumber: 'BOX-2024-002',
    archiveCategory: 'Statis',
    classificationCode: 'HC.03.01',
    documentForm: 'Scan',
    name: 'Budi Santoso',
    nipOrApplicant: 'Budi S',
    archiveType: 'SK',
    archiveDescription: 'SK Pengangkatan Pegawai DJKI 2024',
    documentNumber: 'SK-2024-001',
    documentDate: '2024-02-15',
    securityClassification: 'Rahasia',
    building: 'Gedung B',
    floor: '2',
    cabinet: 'C-05',
    shelf: 'S-02',
    mapOrFolder: 'MAP-10',
    archiveYear: '2024',
    processingUnit: 'Sekretariat Direktorat Jenderal',
    retentionPeriod: 'Permanen',
    additionalNotes: '',
    uploadedBy: 'superadmin',
    uploadDate: '2024-02-15T10:00:00Z'
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'superadmin',
    username: 'superadmin',
    name: 'Super Admin DJKI',
    role: 'SUPERADMIN',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  },
  {
    id: 'admin-merek',
    username: 'adminmerek',
    name: 'Admin Merek',
    role: 'UNIT_ADMIN',
    processingUnit: 'Direktorat Merek dan Indikasi Geografis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'
  },
  {
    id: 'admin-paten',
    username: 'adminpaten',
    name: 'Admin Paten',
    role: 'UNIT_ADMIN',
    processingUnit: 'Direktorat Paten, DTLST, dan Rahasia Dagang',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi'
  }
];

// ======================================================
// LOGIN COMPONENT
// ======================================================
const VaultLogin: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = INITIAL_USERS.find(u => u.username === username);
    if (user && password === 'admin123') {
      onLogin(user);
    } else {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Portal Arsip DJKI</h1>
          <p className="text-slate-500 text-sm">Sistem Arsip Digital Terenkripsi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masukkan username"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masukkan password"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
          >
            Masuk ke Vault
          </button>
        </form>

        <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-xs text-amber-800">
            <strong>Demo:</strong> Username: superadmin, Password: admin123
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// ======================================================
// SIDEBAR COMPONENT
// ======================================================
const Sidebar: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  user: User | null;
  onLogout: () => void;
}> = ({ activeTab, setActiveTab, isOpen, setIsOpen, isCollapsed, setIsCollapsed, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'archive-list', label: 'Daftar Arsip', icon: Archive },
    { id: 'search', label: 'Pencarian', icon: Search },
    { id: 'upload', label: 'Upload Arsip', icon: Upload },
    { id: 'loans', label: 'Peminjaman', icon: FileText },
    { id: 'vault', label: 'Vault Rahasia', icon: Lock },
    { id: 'labels', label: 'Cetak Label', icon: Printer },
    { id: 'scanner', label: 'Scan QR', icon: ScanLine },
    { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'units', label: 'Unit Kerja', icon: Building2 },
    { id: 'categories', label: 'Kategori Arsip', icon: FolderOpen },
    { id: 'classifications', label: 'Keamanan', icon: ShieldCheck },
    { id: 'archive-codes', label: 'Kode Klasifikasi', icon: ListTree },
    { id: 'users', label: 'Manajemen User', icon: UserIcon },
    { id: 'access', label: 'Hak Akses', icon: Shield },
    { id: 'settings', label: 'Pengaturan', icon: RefreshCw },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:static top-0 left-0 h-full bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white z-50 transform transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8 overflow-hidden">
            <div className={`flex items-center gap-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg truncate">Portal Arsip DJKI</h1>
                <p className="text-[10px] text-slate-400">Arsip Digital</p>
              </div>
            </div>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              {isCollapsed ? <ListTree className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>

          <nav className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                title={item.label}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all relative group ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 transition-all ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`transition-all duration-300 font-bold ${isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100'}`}>
                  {item.label}
                </span>
                {isCollapsed && (
                   <div className="absolute left-16 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                     {item.label}
                   </div>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className={`mt-auto p-6 border-t border-slate-800/50 transition-all duration-300 ${isCollapsed ? 'items-center' : ''}`}>
          <div className="flex items-center gap-3 mb-4 overflow-hidden">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-10 h-10 rounded-xl bg-white shrink-0 shadow-sm"
            />
            <div className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-all mb-4 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            <span className={`${isCollapsed ? 'hidden' : 'block'} font-bold`}>Keluar</span>
          </button>
          
          <div className={`pt-4 border-t border-slate-800/50 transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
            <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
              Created By
            </p>
            <p className="text-[11px] text-blue-400 text-center font-black mt-1 uppercase">
              caqiestudioproduction
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

// ======================================================
// ARCHIVE FORM COMPONENT (Input & Edit Same)
// ======================================================
const ArchiveForm: React.FC<{
  archive: Archive | null;
  onSave: (archive: Archive) => void;
  onClose: () => void;
}> = ({ archive, onSave, onClose }) => {
  const [data, setData] = useState<Archive>(archive || { ...EMPTY_ARCHIVE, id: crypto.randomUUID() });
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }), []);

  const handleOcr = async (file: File) => {
    if (!ai) return;
    setIsOcrLoading(true);
    setOcrStatus('processing');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result?.toString().split(',')[1];
        if (!base64Data) throw new Error("Failed to read file");

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data
                }
              },
              {
                text: "Ekstrak seluruh teks dari dokumen ini secara akurat. Jika ini adalah formulir, ekstrak semua data yang ada. Kembalikan hanya teks mentah yang diekstrak."
              }
            ]
          }
        });

        const extractedText = response.text || "";
        setData(prev => ({ ...prev, ocrText: extractedText }));
        setOcrStatus('done');
        setIsOcrLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR Error:", error);
      setOcrStatus('error');
      setIsOcrLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleOcr(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...data,
      uploadDate: data.uploadDate || new Date().toISOString(),
      uploadedBy: data.uploadedBy || 'system'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                title="Kembali"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">
                📝
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  {archive?.id ? 'Edit Arsip' : 'Tambah Arsip Baru'}
                </h2>
                <p className="text-slate-500 text-sm">Lengkapi metadata arsip</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Identitas Arsip */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">1</span>
                Identitas Arsip
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField name="fileNumber" label="Nomor Berkas" value={data.fileNumber} onChange={handleChange} placeholder="F-2024-XXX" />
                <InputField name="archiveItemNumber" label="Nomor Item" value={data.archiveItemNumber} onChange={handleChange} placeholder="ITEM-01" />
                <InputField name="boxNumber" label="Nomor Box" value={data.boxNumber} onChange={handleChange} placeholder="BOX-2024-XXX" />
                <SelectField name="archiveCategory" label="Kategori" value={data.archiveCategory} onChange={handleChange} options={['Aktif', 'Inaktif', 'Statis', 'Vital']} />
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Kode Klasifikasi</label>
                  <select
                    name="classificationCode"
                    value={data.classificationCode}
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      const mapping = CLASSIFICATION_CODES.find(c => `${c.mainCode}.${c.subCode}` === selectedCode);
                      if (mapping) {
                        setData(prev => ({
                          ...prev,
                          classificationCode: selectedCode,
                          archiveType: mapping.archiveType,
                          archiveDescription: mapping.description
                        }));
                      } else {
                        setData(prev => ({ ...prev, classificationCode: selectedCode }));
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">-- Pilih Kode Klasifikasi --</option>
                    {CLASSIFICATION_CODES.map(item => (
                      <option key={`${item.mainCode}.${item.subCode}`} value={`${item.mainCode}.${item.subCode}`}>
                        {item.mainCode}.{item.subCode} - {item.archiveType}
                      </option>
                    ))}
                  </select>
                </div>
                <SelectField name="documentForm" label="Bentuk Naskah" value={data.documentForm} onChange={handleChange} options={['Asli', 'Salinan', 'Scan']} />
              </div>
            </div>

            {/* Section 2: Informasi Arsip */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">2</span>
                Informasi Arsip
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField name="name" label="Nama / Pemohon" value={data.name} onChange={handleChange} placeholder="Nama Lengkap" required />
                <InputField name="nipOrApplicant" label="NIP / Identitas" value={data.nipOrApplicant} onChange={handleChange} placeholder="NIP atau Identitas" />
                <InputField name="archiveType" label="Jenis Arsip" value={data.archiveType} onChange={handleChange} placeholder="SK, Sertifikat, dll" required />
                <InputField name="archiveDescription" label="Keterangan Arsip" value={data.archiveDescription} onChange={handleChange} placeholder="Penjelasan isi arsip" required />
                <InputField name="documentNumber" label="Nomor Dokumen" value={data.documentNumber} onChange={handleChange} placeholder="No. Surat / Sertifikat" required />
                <InputField name="documentDate" label="Tanggal Dokumen" type="date" value={data.documentDate} onChange={handleChange} required />
              </div>
            </div>

            {/* Section 3: Status & Keamanan */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">3</span>
                Status & Keamanan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField name="securityClassification" label="Klasifikasi Keamanan" value={data.securityClassification} onChange={handleChange} options={['Terbuka', 'Terbatas', 'Rahasia']} />
                <InputField name="retentionPeriod" label="Masa Retensi" value={data.retentionPeriod} onChange={handleChange} placeholder="10 Tahun" />
              </div>
            </div>

            {/* Section 4: Lokasi Penyimpanan */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">4</span>
                Lokasi Penyimpanan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField name="building" label="Gedung" value={data.building} onChange={handleChange} placeholder="Gedung A" />
                <InputField name="floor" label="Lantai" value={data.floor} onChange={handleChange} placeholder="1" />
                <InputField name="cabinet" label="Lemari" value={data.cabinet} onChange={handleChange} placeholder="C-01" />
                <InputField name="shelf" label="Rak" value={data.shelf} onChange={handleChange} placeholder="Rak 1" />
                <InputField name="mapOrFolder" label="Map / Folder" value={data.mapOrFolder} onChange={handleChange} placeholder="Map 01" />
                <InputField name="archiveYear" label="Tahun Arsip" value={data.archiveYear} onChange={handleChange} placeholder="2024" />
              </div>
            </div>

            {/* Section 5: Unit & Tambahan */}
            <div>
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">5</span>
                Media & Tambahan
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <SelectField name="processingUnit" label="Unit Pengolah" value={data.processingUnit} onChange={handleChange} options={DJKI_UNITS} />
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase">Input Berkas Digital (OCR Otomatis)</label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="application/pdf,image/*"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                      ocrStatus === 'processing' ? 'border-amber-400 bg-amber-50 animate-pulse' :
                      ocrStatus === 'done' ? 'border-emerald-400 bg-emerald-50' :
                      'border-slate-200 bg-slate-50 hover:border-blue-400'
                    }`}
                  >
                    {ocrStatus === 'processing' ? (
                      <div className="space-y-2">
                        <RefreshCw className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-spin" />
                        <p className="text-sm font-bold text-amber-700">Sedang Mengekstrak Teks (AI)...</p>
                      </div>
                    ) : ocrStatus === 'done' ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-emerald-700">Teks Berhasil Diekstrak!</p>
                        <p className="text-[10px] text-emerald-500 uppercase font-black">Konten siap diproses untuk pencarian</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-500">Klik untuk Unggah Berkas PDF/Gambar</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">AI akan otomatis membaca isi dokumen</p>
                      </>
                    )}
                  </div>
                  
                  {data.ocrText && (
                    <div className="mt-4 p-4 bg-slate-100 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Preview Hasil Ekstraksi Teks:</p>
                      <div className="max-h-32 overflow-y-auto text-[10px] text-slate-600 font-mono leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                        {data.ocrText}
                      </div>
                    </div>
                  )}
                </div>

                <TextAreaField name="additionalNotes" label="Catatan Tambahan" value={data.additionalNotes} onChange={handleChange} rows={3} />
              </div>
            </div>

            {/* QR Code Preview */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Preview QR Code Arsip
              </h3>
              <div className="flex items-center gap-6">
                <QRCodeSVG
                  value={JSON.stringify({
                    id: data.id,
                    fileNumber: data.fileNumber,
                    name: data.name,
                    archiveDescription: data.archiveDescription
                  })}
                  size={120}
                  level="H"
                />
                <div className="text-sm text-slate-600">
                  <p>QR Code akan digenerate otomatis</p>
                  <p className="text-xs text-slate-400">Scan untuk melihat detail arsip</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Simpan Arsip
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// Helper Form Components
const InputField: React.FC<{
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}> = ({ name, label, value, onChange, placeholder, type = 'text', required }) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
    />
  </div>
);

const SelectField: React.FC<{
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}> = ({ name, label, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
    >
      <option value="">Pilih {label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const TextAreaField: React.FC<{
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}> = ({ name, label, value, onChange, rows = 3 }) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
    />
  </div>
);

// ======================================================
// ARCHIVE DETAIL COMPONENT
// ======================================================
const ArchiveDetail: React.FC<{
  archive: Archive;
  onClose: () => void;
  onEdit: (archive: Archive) => void;
}> = ({ archive, onClose, onEdit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
    >
      {/* Detail Header */}
      <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-start">
        <div className="flex gap-6">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            <Archive className="w-12 h-12 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-1 bg-white/20 text-[10px] font-black uppercase tracking-widest rounded">
                {archive.archiveCategory}
              </span>
              <span className="px-2 py-1 bg-red-500/80 text-[10px] font-black uppercase tracking-widest rounded">
                {archive.securityClassification}
              </span>
            </div>
            <h2 className="text-3xl font-black mb-1">{archive.name}</h2>
            <p className="text-blue-100 font-medium">{archive.archiveDescription}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 hover:bg-white/10 rounded-xl transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <DetailItem label="Nomor Berkas" value={archive.fileNumber} icon={FileText} />
            <DetailItem label="Nomor Dokumen" value={archive.documentNumber} icon={Database} />
            <DetailItem label="Tanggal Dokumen" value={archive.documentDate} icon={Clock} />
            <DetailItem label="Jenis Arsip" value={archive.archiveType} icon={ListTree} />
            <DetailItem label="Bentuk Fisik" value={archive.documentForm} icon={Archive} />
            <DetailItem label="Masa Retensi" value={archive.retentionPeriod} icon={RefreshCw} />
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Lokasi Penyimpanan
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-slate-400 font-bold text-[10px] uppercase">Gedung</p><p className="font-bold text-slate-700">{archive.building}</p></div>
              <div><p className="text-slate-400 font-bold text-[10px] uppercase">Lantai</p><p className="font-bold text-slate-700">{archive.floor}</p></div>
              <div><p className="text-slate-400 font-bold text-[10px] uppercase">Lemari</p><p className="font-bold text-slate-700">{archive.cabinet}</p></div>
              <div><p className="text-slate-400 font-bold text-[10px] uppercase">Rak / Baris</p><p className="font-bold text-slate-700">{archive.shelf}</p></div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-black text-slate-800">Catatan Tambahan</h4>
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 italic text-slate-600">
              {archive.additionalNotes || 'Tidak ada catatan tambahan.'}
            </div>
          </div>

          {archive.ocrText && (
            <div className="space-y-3">
              <h4 className="font-black text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Konten Digital (Hasil OCR AI)
              </h4>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs text-slate-600 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto shadow-inner">
                {archive.ocrText}
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic">
                *Teks di atas diekstrak menggunakan kecerdasan buatan dan dapat dicari melalui kolom pencarian.
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={() => onEdit(archive)}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              <Edit className="w-4 h-4" /> Edit Metadata
            </button>
            <button 
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              onClick={() => {
                if (archive.fileUrl) window.open(archive.fileUrl, '_blank');
                else alert('File PDF belum diunggah.');
              }}
            >
              <Eye className="w-4 h-4" /> Lihat Berkas PDF
            </button>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">QR Code Identifikasi</p>
            <QRCodeSVG 
              value={JSON.stringify({ id: archive.id, fn: archive.fileNumber })} 
              size={180}
              level="H"
              marginSize={2}
            />
            <p className="mt-4 text-[11px] text-slate-500 font-bold text-center">ID: {archive.id}</p>
          </div>

          <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h4 className="font-black text-indigo-900 text-xs uppercase mb-4">Metadata System</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-indigo-400 font-black uppercase">Diupload Oleh</p>
                  <p className="text-sm font-bold text-indigo-900">{archive.uploadedBy || 'System'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-indigo-400 font-black uppercase">Tanggal Upload</p>
                  <p className="text-sm font-bold text-indigo-900">{archive.uploadDate ? new Date(archive.uploadDate).toLocaleString('id-ID') : '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-indigo-400 font-black uppercase">Unit Pengolah</p>
                  <p className="text-sm font-bold text-indigo-900">{archive.processingUnit}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ======================================================
// LOAN FORM COMPONENT
// ======================================================
const LoanFormModal: React.FC<{
  archives: Archive[];
  onClose: () => void;
  onSave: (docId: string, name: string, nip: string, unit: string, notes: string) => void;
}> = ({ archives, onClose, onSave }) => {
  const [selectedArchiveId, setSelectedArchiveId] = useState('');
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [searchDoc, setSearchDoc] = useState('');

  const filteredArchives = archives.filter(doc => 
    doc.name.toLowerCase().includes(searchDoc.toLowerCase()) || 
    doc.fileNumber.toLowerCase().includes(searchDoc.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Form Peminjaman Arsip</h3>
            <p className="text-slate-500 text-sm">Silahkan isi data peminjam dan arsip yang dipinjam.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Cari & Pilih Arsip</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Ketik nama atau nomor berkas..."
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto border border-slate-100 rounded-2xl p-2 space-y-1 custom-scrollbar">
              {filteredArchives.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedArchiveId(doc.id)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all ${
                    selectedArchiveId === doc.id 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <p className="font-bold">{doc.name}</p>
                  <p className={selectedArchiveId === doc.id ? 'text-blue-100' : 'text-slate-400'}>{doc.fileNumber} • {doc.processingUnit}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Peminjam</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Ahmad Subardjo"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NIP Peminjam</label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1987..."
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit Kerja Peminjam</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Unit Kerja --</option>
              {DJKI_UNITS.map(unitOption => (
                <option key={unitOption} value={unitOption}>{unitOption}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Catatan Keperluan</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="Sebutkan alasan peminjaman..."
            ></textarea>
          </div>
        </div>

        <div className="p-8 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
          <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all">Batal</button>
          <button
            onClick={() => onSave(selectedArchiveId, name, nip, unit, notes)}
            disabled={!selectedArchiveId || !name || !unit}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 transition-all"
          >
            Konfirmasi Pinjam
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ReturnFormModal: React.FC<{
  loan: LoanRecord;
  archive: Archive | undefined;
  onClose: () => void;
  onSave: (loanId: string, notes: string) => void;
}> = ({ loan, archive, onClose, onSave }) => {
  const [notes, setNotes] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Form Pengembalian Arsip</h3>
          <p className="text-slate-500 text-sm">Pastikan kondisi arsip kembali sesuai saat dipinjam.</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                <Archive className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-blue-400 uppercase mb-0.5">Arsip Dipinjam</p>
                <p className="text-sm font-bold text-blue-900 leading-tight">{archive?.name}</p>
                <p className="text-[10px] text-blue-400 uppercase font-black">{archive?.fileNumber}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Peminjam</p>
               <p className="text-sm font-bold text-slate-800">{loan.borrowerName}</p>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tgl Pinjam</p>
               <p className="text-sm font-bold text-slate-800">{new Date(loan.loanDate).toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kondisi / Catatan Kembali</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="Contoh: Kondisi baik, lengkap..."
            ></textarea>
          </div>
        </div>

        <div className="p-8 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all">Batal</button>
          <button
            onClick={() => onSave(loan.id, notes)}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
          >
            Selesaikan Pengembalian
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DetailItem: React.FC<{ label: string; value: string; icon: React.ComponentType<any> }> = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-800 leading-tight">{value || '-'}</p>
    </div>
  </div>
);

// ======================================================
// MAIN APP COMPONENT
// ======================================================
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [documents, setDocuments] = useState<Archive[]>(INITIAL_DOCS);
  const [boxes, setBoxes] = useState<ArchiveBox[]>(INITIAL_BOXES);
  const [selectedBox, setSelectedBox] = useState<ArchiveBox | null>(null);
  const [selectedArchiveForLabel, setSelectedArchiveForLabel] = useState<Archive | null>(null);
  const [labelMode, setLabelMode] = useState<'box' | 'berkas'>('box');
  const [searchLabel, setSearchLabel] = useState('');
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterLocation, setFilterLocation] = useState('Semua');
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [filterYear, setFilterYear] = useState('Semua');
  const [searchCodeQuery, setSearchCodeQuery] = useState('');
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<Archive | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<LoanRecord | null>(null);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<Archive | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reportPeriod, setReportPeriod] = useState('Semua');
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Clear detail view when tab changes
  useEffect(() => {
    setSelectedDocForDetail(null);
  }, [activeTab]);

  // Filter documents
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const isAuthorized = currentUser?.role === 'SUPERADMIN' || 
        doc.processingUnit === currentUser?.processingUnit ||
        doc.securityClassification !== 'Rahasia';
      
      if (!isAuthorized) return false;

      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = 
        doc.archiveDescription.toLowerCase().includes(searchStr) || 
        doc.documentNumber.toLowerCase().includes(searchStr) ||
        doc.name.toLowerCase().includes(searchStr) ||
        doc.fileNumber.toLowerCase().includes(searchStr) ||
        doc.processingUnit.toLowerCase().includes(searchStr) ||
        doc.archiveType.toLowerCase().includes(searchStr) ||
        doc.archiveCategory.toLowerCase().includes(searchStr) ||
        doc.building.toLowerCase().includes(searchStr) ||
        doc.yearRange.toLowerCase().includes(searchStr) ||
        doc.additionalNotes.toLowerCase().includes(searchStr) ||
        (doc.ocrText?.toLowerCase().includes(searchStr) || false);
      
      const matchesCategory = filterCategory === 'Semua' || doc.archiveCategory === filterCategory;
      const matchesLocation = filterLocation === 'Semua' || doc.building === filterLocation;
      const matchesUnit = filterUnit === 'Semua' || doc.processingUnit === filterUnit;
      const matchesYear = filterYear === 'Semua' || doc.archiveYear === filterYear;
      
      return matchesSearch && matchesCategory && matchesLocation && matchesUnit && matchesYear;
    });
  }, [documents, searchQuery, filterCategory, filterLocation, filterUnit, filterYear, currentUser]);

  const filteredCodes = useMemo(() => {
    return CLASSIFICATION_CODES.filter(item => 
      item.mainCode.toLowerCase().includes(searchCodeQuery.toLowerCase()) ||
      item.subCode.toLowerCase().includes(searchCodeQuery.toLowerCase()) ||
      item.archiveType.toLowerCase().includes(searchCodeQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchCodeQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchCodeQuery.toLowerCase())
    );
  }, [searchCodeQuery]);

  // Stats per unit
  const unitStats = useMemo(() => {
    return DJKI_UNITS.map(unit => ({
      name: unit,
      count: documents.filter(d => d.processingUnit === unit).length
    }));
  }, [documents]);

  // Handle login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setActiveTab('dashboard');
  };

  // Save archive
  const saveArchive = (archive: Archive) => {
    const exist = documents.find(d => d.id === archive.id);
    if (exist) {
      setDocuments(documents.map(d => d.id === archive.id ? archive : d));
    } else {
      setDocuments([...documents, archive]);
    }
    setShowForm(false);
    setSelectedDocForEdit(null);
  };

  // Delete archive
  const deleteArchive = (id: string) => {
    if (window.confirm('Hapus arsip ini?')) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(documents.map(doc => ({
      'Nomor Berkas': doc.fileNumber,
      'Nama': doc.name,
      'Jenis': doc.archiveType,
      'Kategori': doc.archiveCategory,
      'Unit': doc.processingUnit,
      'Lokasi': `${doc.building}, L${doc.floor}`,
      'Tahun': doc.archiveYear
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Arsip");
    XLSX.writeFile(workbook, `Arsip_DJKI_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Import from Excel
  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      
      const newDocs: Archive[] = json.map((row: any, index) => ({
        ...EMPTY_ARCHIVE,
        id: crypto.randomUUID(),
        fileNumber: row['Nomor Berkas'] || `F-${new Date().getFullYear()}-${index + 1}`,
        name: row['Nama'] || '',
        archiveType: row['Jenis'] || '',
        archiveCategory: (row['Kategori'] as ArchiveCategory) || 'Aktif',
        processingUnit: row['Unit'] || DJKI_UNITS[0],
        building: row['Gedung'] || '',
        floor: row['Lantai'] || '',
        archiveYear: row['Tahun'] || new Date().getFullYear().toString(),
        uploadDate: new Date().toISOString(),
        uploadedBy: currentUser?.id
      }));

      setDocuments([...documents, ...newDocs]);
      alert(`Berhasil import ${newDocs.length} arsip`);
    };
    reader.readAsBinaryString(file);
  };

  // QR Scanner
  useEffect(() => {
    const startScanner = async () => {
      if (activeTab === 'scanner' && isScanning) {
        try {
          const devs = await Html5Qrcode.getCameras();
          setCameras(devs.map(d => ({ id: d.id, label: d.label })));
          if (devs.length > 0 && !selectedCameraId) {
            setSelectedCameraId(devs[0].id);
          }

          scannerRef.current = new Html5Qrcode('reader');
          await scannerRef.current.start(
            selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              try {
                const data = JSON.parse(decodedText);
                setScannedData(data);
                setIsScanning(false);
              } catch (e) {
                setScannedData({ raw: decodedText });
                setIsScanning(false);
              }
            },
            () => {}
          );
        } catch (err) {
          console.error("Camera error:", err);
          setIsScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [activeTab, isScanning, selectedCameraId]);

  // Loan functions
  const createLoan = (archiveId: string, borrowerName: string, borrowerNip: string, borrowerUnit: string, notes: string) => {
    const loan: LoanRecord = {
      id: crypto.randomUUID(),
      archiveId,
      borrowerName,
      borrowerNip,
      borrowerUnit,
      loanDate: new Date().toISOString(),
      status: 'Dipinjam',
      notes
    };
    setLoans([loan, ...loans]);
    setShowLoanForm(false);
  };

  const returnLoan = (loanId: string, notes: string) => {
    setLoans(loans.map(l => 
      l.id === loanId 
        ? { ...l, status: 'Dikembalikan', returnDate: new Date().toISOString(), notes: `${l.notes}\n\n[Kembali]: ${notes}` }
        : l
    ));
    setShowReturnForm(false);
    setSelectedLoanForReturn(null);
  };

  // Vault access
  const accessVault = () => {
    if (vaultPassword === 'vault123') {
      setShowVault(true);
      setVaultPassword('');
    } else {
      alert('Password vault salah!');
    }
  };

  // Print label
  const printLabel = () => {
    window.print();
  };

  // Show login if not logged in
  if (!isLoggedIn) {
    return <VaultLogin onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        user={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 bg-white rounded-xl shadow-sm"
              >
                ☰
              </button>
              <div>
                <h1 className="text-2xl font-black text-slate-800 capitalize">
                  {activeTab === 'dashboard' && 'Dashboard Analitik'}
                  {activeTab === 'archive-list' && 'Daftar Arsip'}
                  {activeTab === 'search' && 'Pencarian Arsip'}
                  {activeTab === 'upload' && 'Upload Arsip'}
                  {activeTab === 'loans' && 'Peminjaman Arsip'}
                  {activeTab === 'vault' && 'Vault Rahasia'}
                  {activeTab === 'labels' && 'Cetak Label'}
                  {activeTab === 'scanner' && 'Scan QR Code'}
                  {activeTab === 'archive-codes' && 'Daftar Kode Klasifikasi'}
                  {activeTab === 'reports' && 'Laporan'}
                  {activeTab === 'units' && 'Unit DJKI'}
                  {activeTab === 'users' && 'Pengguna'}
                  {activeTab === 'settings' && 'Pengaturan'}
                </h1>
                <p className="text-slate-500 text-sm">Sistem Manajemen Arsip Digital DJKI</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-slate-800 font-black flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer transition-all">
                  <Upload className="w-3 h-3" />
                  Import
                  <input type="file" accept=".xlsx,.xls" onChange={importFromExcel} className="hidden" />
                </label>
              </div>
            </div>
          </header>

          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Arsip" value={documents.length} icon={Archive} color="bg-blue-600" />
                <StatCard title="Arsip Aktif" value={documents.filter(d => d.archiveCategory === 'Aktif').length} icon={CheckCircle} color="bg-emerald-600" />
                <StatCard title="Arsip Rahasia" value={documents.filter(d => d.securityClassification === 'Rahasia').length} icon={Lock} color="bg-red-600" />
                <StatCard title="Sedang Dipinjam" value={loans.filter(l => l.status === 'Dipinjam').length} icon={FileText} color="bg-amber-600" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Statistik Per Unit DJKI</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={unitStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Distribusi Kategori</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Aktif', value: documents.filter(d => d.archiveCategory === 'Aktif').length },
                          { name: 'Inaktif', value: documents.filter(d => d.archiveCategory === 'Inaktif').length },
                          { name: 'Statis', value: documents.filter(d => d.archiveCategory === 'Statis').length },
                          { name: 'Vital', value: documents.filter(d => d.archiveCategory === 'Vital').length },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {['#10b981', '#f59e0b', '#6366f1', '#ef4444'].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Upload Arsip Tab */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-8">
                <Upload className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2 font-sans tracking-tight">Unggah Berkas Baru</h2>
              <p className="text-slate-500 mb-10 max-w-sm text-center font-medium leading-relaxed">Digitalisasi arsip fisik Anda dengan sistem penomoran dan metadata terintegrasi DJKI.</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center gap-3 active:scale-95"
              >
                <Plus className="w-5 h-5" /> Mulai Registrasi Arsip
              </button>
            </div>
          )}

          {/* Archive List / Detail / Search */}
          {(activeTab === 'archive-list' || activeTab === 'search') && (
            <div className="space-y-6">
              {selectedDocForDetail ? (
                <ArchiveDetail 
                  archive={selectedDocForDetail} 
                  onClose={() => setSelectedDocForDetail(null)}
                  onEdit={(archive) => {
                    setSelectedDocForEdit(archive);
                    setShowForm(true);
                  }}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pt-2 border-t border-slate-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedDocForEdit(null);
                        setShowForm(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 shadow-sm shadow-blue-100 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Tambah Arsip
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 shadow-sm shadow-emerald-100 transition-all flex items-center gap-2"
                    >
                      <Download className="w-3 h-3" /> Excel
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-black hover:bg-slate-700 shadow-sm transition-all flex items-center gap-2"
                    >
                      <Printer className="w-3 h-3" /> Cetak
                    </button>
                  </div>
                  
                  <div className="flex flex-1 min-w-[300px] gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Cari apa saja (Nama, No Berkas, Unit, Tahun, Lokasi)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
                    >
                      <option value="Semua">Semua Kategori</option>
                      <option value="Aktif">Aktif</option>
                      <option value="Inaktif">Inaktif</option>
                      <option value="Statis">Statis</option>
                      <option value="Vital">Vital</option>
                    </select>
                    <select
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
                    >
                      <option value="Semua">Semua Lokasi</option>
                      {Array.from(new Set(documents.map(d => d.building))).map(building => (
                        <option key={building} value={building}>{building}</option>
                      ))}
                    </select>
                    <select
                      value={filterUnit}
                      onChange={(e) => setFilterUnit(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none max-w-[150px]"
                    >
                      <option value="Semua">Semua Unit</option>
                      {DJKI_UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
                    >
                      <option value="Semua">Semua Tahun</option>
                      {Array.from(new Set(documents.map(d => d.archiveYear) as string[])).filter((y: string) => y && y.length === 4).sort((a: string, b: string) => b.localeCompare(a)).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">No Berkas</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Nama</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Lokasi</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Kategori</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-mono">{doc.fileNumber}</td>
                        <td className="px-4 py-3 text-sm">{doc.name}</td>
                        <td className="px-4 py-3 text-sm">{doc.building} / {doc.floor}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            doc.archiveCategory === 'Aktif' ? 'bg-emerald-100 text-emerald-700' :
                            doc.archiveCategory === 'Vital' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {doc.archiveCategory}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedDocForDetail(doc)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDocForEdit(doc);
                                setShowForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteArchive(doc.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
            </div>
          )}

          {/* Scanner */}
          {activeTab === 'scanner' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Camera className="w-6 h-6 text-blue-600" />
                  Scanner QR Arsip
                </h3>
                
                <div className="mb-6">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Pilih Sumber Kamera</label>
                  <select 
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {cameras.length === 0 && <option>Mencari kamera...</option>}
                    {cameras.map(cam => (
                      <option key={cam.id} value={cam.id}>{cam.label}</option>
                    ))}
                  </select>
                </div>

                <div id="reader" className="aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-inner ring-1 ring-slate-200"></div>
                
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setIsScanning(!isScanning)}
                    className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 ${
                      isScanning 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isScanning ? (
                      <><RefreshCw className="w-4 h-4 animate-spin-slow" /> Hentikan Scanner</>
                    ) : (
                      <><ScanLine className="w-4 h-4" /> Buka Kamera</>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {scannedData ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200"
                    >
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-sm shadow-emerald-100">
                        <CheckCircle className="w-10 h-10" />
                      </div>
                      <h3 className="font-black text-slate-800 text-2xl text-center mb-2">Terdeteksi!</h3>
                      <p className="text-slate-400 text-sm text-center mb-8">Metadata arsip berhasil dibaca sistem.</p>
                      
                      <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Nomor Berkas</p>
                          <p className="font-black text-slate-800 text-lg leading-tight">{scannedData.fileNumber || scannedData.fn || 'Tidak Diketahui'}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-200/50">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Nama Arsip</p>
                          <p className="text-sm font-bold text-slate-600 leading-tight">{scannedData.name || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => {
                            const target = documents.find(d => d.id === scannedData.id || d.fileNumber === (scannedData.fileNumber || scannedData.fn));
                            if (target) {
                              setSelectedDocForDetail(target);
                              setActiveTab('archive-list');
                            } else {
                              alert('Maaf, arsip ini belum terdaftar di database utama.');
                            }
                          }}
                          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" /> Buka Detail Arsip
                        </button>
                        <button 
                          onClick={() => setScannedData(null)}
                          className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                        >
                          Scan Ulang
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white p-12 rounded-3xl shadow-sm border border-dashed border-slate-200 flex flex-col items-center justify-center text-center h-full min-h-[500px]"
                    >
                      <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-8">
                        <ScanLine className="w-12 h-12" />
                      </div>
                      <h4 className="text-xl font-black text-slate-400 mb-2">Siap Memindai</h4>
                      <p className="text-slate-400 text-sm max-w-xs leading-relaxed font-medium">Arahkan kamera ke label QR Code pada box atau map arsip untuk melihat detail digital secara instan.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Loans */}
          {activeTab === 'loans' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Peminjaman</h3>
                  <p className="text-slate-500 font-medium">Tracking sirkulasi dokumen fisik dan peta ketersediaan arsip.</p>
                </div>
                <button
                  onClick={() => setShowLoanForm(true)}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" /> Buat Peminjaman Baru
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {[
                   { label: 'Total Peminjaman', value: loans.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                   { label: 'Sedang Dipinjam', value: loans.filter(l => l.status === 'Dipinjam').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                   { label: 'Sudah Kembali', value: loans.filter(l => l.status === 'Dikembalikan').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                   { label: 'Keterlambatan', value: 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                 ].map((stat, i) => (
                    <div key={i} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                       <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0`}>
                          <stat.icon className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                          <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                   <h4 className="font-black text-slate-800 tracking-tight">Log Sirkulasi Terkini</h4>
                   <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                         <input type="text" placeholder="Cari peminjam..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 w-48" />
                      </div>
                   </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Arsip & Peminjam</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Periode Pinjam</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loans.map((loan) => {
                        const archive = documents.find(d => d.id === loan.archiveId);
                        return (
                          <tr key={loan.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                   <Archive className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-800 leading-tight mb-0.5">{archive?.name || 'Arsip Dihapus'}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{loan.borrowerName} • {loan.borrowerNip}</p>
                                  <p className="text-[9px] text-blue-500 font-black uppercase mt-0.5">{loan.borrowerUnit}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div>
                                <p className="text-xs font-bold text-slate-700">Pinjam: {new Date(loan.loanDate).toLocaleDateString('id-ID')}</p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  {loan.returnDate ? `Balik: ${new Date(loan.returnDate).toLocaleDateString('id-ID')}` : 'Estimasi: 7 Hari'}
                                </p>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                loan.status === 'Dipinjam' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                loan.status === 'Dikembalikan' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {loan.status === 'Dipinjam' ? 'Sedang Keluar' : 'Sudah Kembali'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              {loan.status === 'Dipinjam' ? (
                                <button
                                  onClick={() => {
                                    setSelectedLoanForReturn(loan);
                                    setShowReturnForm(true);
                                  }}
                                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                                >
                                  Kembalikan
                                </button>
                              ) : (
                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Lihat History">
                                   <Plus className="w-5 h-5 rotate-45" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {loans.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center justify-center opacity-30">
                               <FileText className="w-16 h-16 mb-4" />
                               <p className="font-black text-lg">Tidak Ada Data Peminjaman</p>
                               <p className="text-xs">Sirkulasi arsip fisik akan muncul di sini</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Vault */}
          {activeTab === 'vault' && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {!showVault ? (
                <div className="text-center py-12">
                  <Lock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Vault Arsip Rahasia</h3>
                  <input
                    type="password"
                    value={vaultPassword}
                    onChange={(e) => setVaultPassword(e.target.value)}
                    placeholder="Masukkan password vault"
                    className="px-4 py-3 border border-slate-200 rounded-xl mb-4 w-full max-w-md"
                  />
                  <button
                    onClick={accessVault}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                  >
                    Akses Vault
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-red-600" />
                      Arsip Rahasia
                    </h3>
                    <button
                      onClick={() => setShowVault(false)}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      Keluar dari Vault
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.filter(d => d.securityClassification === 'Rahasia').map((doc) => (
                      <div key={doc.id} className="p-4 border border-red-200 rounded-xl bg-red-50">
                        <p className="font-bold text-slate-800">{doc.name}</p>
                        <p className="text-sm text-slate-600">{doc.archiveDescription}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">
                          RAHASIA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Labels */}
          {activeTab === 'labels' && (
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Sistem Cetak Label</h3>
                  <p className="text-sm text-slate-500">Cetak label identitas untuk Box Arisip atau Map Berkas</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    className={`px-6 py-2 text-xs font-black rounded-lg transition-all ${
                      labelMode === 'box' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-blue-600'
                    }`}
                    onClick={() => setLabelMode('box')}
                  >
                    Label Box
                  </button>
                  <button 
                    className={`px-6 py-2 text-xs font-black rounded-lg transition-all ${
                      labelMode === 'berkas' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-blue-600'
                    }`}
                    onClick={() => setLabelMode('berkas')}
                  >
                    Label Berkas
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  {labelMode === 'box' ? (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Pilih Box Arsip</label>
                      <select
                        value={selectedBox?.id || ''}
                        onChange={(e) => {
                          const box = boxes.find(b => b.id === e.target.value);
                          setSelectedBox(box || null);
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Pilih Box --</option>
                        {boxes.map((box) => (
                          <option key={box.id} value={box.id}>{box.boxNumber} - {box.processingUnit}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Cari Berkas</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Ketik nama atau nomor berkas..."
                            value={searchLabel}
                            onChange={(e) => setSearchLabel(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-2xl p-2 space-y-1 custom-scrollbar">
                        {documents
                          .filter(doc => 
                            doc.name.toLowerCase().includes(searchLabel.toLowerCase()) || 
                            doc.fileNumber.toLowerCase().includes(searchLabel.toLowerCase())
                          )
                          .map(doc => (
                            <button
                              key={doc.id}
                              onClick={() => setSelectedArchiveForLabel(doc)}
                              className={`w-full text-left p-3 rounded-xl text-xs transition-all ${
                                selectedArchiveForLabel?.id === doc.id 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                  : 'hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              <p className="font-bold">{doc.name}</p>
                              <p className="opacity-60">{doc.fileNumber} • {doc.archiveType}</p>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100">
                    <button
                      onClick={() => window.print()}
                      disabled={labelMode === 'box' ? !selectedBox : !selectedArchiveForLabel}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-100 transition-all"
                    >
                      <Printer className="w-5 h-5" /> Cetak Label Sekarang
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-4">
                      Label akan dicetak sesuai standar ukuran berkas (75mm x 38mm)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-3xl border border-slate-100 min-h-[400px] relative">
                  <p className="absolute top-4 left-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preview Cetak</p>
                  
                  {labelMode === 'box' && selectedBox ? (
                    <div id="printable-label" className="bg-white border-2 border-slate-900 p-4 w-[75mm] h-[38mm] flex items-center gap-4 shadow-sm">
                      <QRCodeSVG
                        value={JSON.stringify({ id: selectedBox.id, type: 'box', num: selectedBox.boxNumber })}
                        size={60}
                        level="H"
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-black text-red-600 uppercase mb-0.5 tracking-tighter">Box Arsip DJKI</p>
                        <h4 className="text-sm font-black text-slate-900 truncate">{selectedBox.boxNumber}</h4>
                        <p className="text-[8px] font-bold text-slate-500 uppercase truncate mt-0.5">{selectedBox.processingUnit}</p>
                        <p className="text-[7px] text-slate-400 mt-1 italic truncate">{selectedBox.location}</p>
                      </div>
                    </div>
                  ) : labelMode === 'berkas' && selectedArchiveForLabel ? (
                    <div id="printable-label" className="bg-white border-2 border-slate-900 p-4 w-[75mm] h-[38mm] flex items-center gap-4 shadow-sm">
                      <QRCodeSVG
                        value={JSON.stringify({ id: selectedArchiveForLabel.id, type: 'berkas', num: selectedArchiveForLabel.fileNumber })}
                        size={60}
                        level="H"
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-0.5 tracking-tighter">Berkas Digital DJKI</p>
                        <h4 className="text-sm font-black text-slate-900 truncate">{selectedArchiveForLabel.fileNumber}</h4>
                        <p className="text-[8px] font-bold text-slate-600 truncate">{selectedArchiveForLabel.name}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[7px] bg-slate-100 px-1 py-0.5 rounded font-bold uppercase">{selectedArchiveForLabel.archiveCategory}</span>
                          <span className="text-[7px] bg-slate-100 px-1 py-0.5 rounded font-bold uppercase">{selectedArchiveForLabel.archiveType}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-300">
                      <Printer className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="font-bold">Belum ada data terpilih</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

            {/* Reports */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Laporan Digital DJKI</h3>
                    <p className="text-sm text-slate-500">Monitor aktivitas arsip per periode</p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['Harian', 'Mingguan', 'Bulanan', 'Semua'].map(period => (
                      <button 
                        key={period}
                        className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                          reportPeriod === period 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-slate-500 hover:text-blue-600'
                        }`}
                        onClick={() => setReportPeriod(period)}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Arsip Diunggah</p>
                    <p className="text-4xl font-black">{documents.length}</p>
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-xs">
                      <span className="bg-white/20 px-2 py-0.5 rounded font-black">+12%</span>
                      <span className="opacity-60 text-[10px]">Dari bulan lalu</span>
                    </div>
                  </div>
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Nota Dinas Terbit</p>
                    <p className="text-3xl font-black text-slate-800">42</p>
                    <div className="mt-4 text-emerald-500 text-xs font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Proses Selesai
                    </div>
                  </div>
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">User Aktif</p>
                    <p className="text-3xl font-black text-slate-800">{users.length}</p>
                    <div className="mt-4 flex -space-x-2">
                       {users.map(u => <img key={u.id} src={u.avatar} className="w-6 h-6 rounded-full border-2 border-white" alt="" />)}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                  <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Aktivitas Terbaru
                  </h4>
                  <div className="space-y-4">
                    {documents.slice(0, 3).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Plus className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">Arsip Baru Diunggah</p>
                            <p className="text-[10px] text-slate-400 font-medium">No: {doc.fileNumber} • Oleh: {doc.uploadedBy || 'System'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                  <button
                    onClick={exportToExcel}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export Laporan Lengkap (.xlsx)
                  </button>
                  <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    <Printer className="w-4 h-4" /> Cetak Laporan PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Units */}
          {activeTab === 'units' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">Daftar Unit Kerja DJKI</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">+ Unit Baru</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DJKI_UNITS.map((unit) => (
                    <div key={unit} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:border-blue-200 transition-all group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{unit}</h4>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-2xl font-black text-blue-600">
                          {documents.filter(d => d.processingUnit === unit).length}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Arsip</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Master Kategori Arsip</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">+ Kategori Baru</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Aktif', 'Inaktif', 'Statis', 'Vital'].map(cat => (
                  <div key={cat} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <FolderOpen className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <p className="font-black text-slate-800">{cat}</p>
                    <p className="text-xs text-slate-500 mt-1">{documents.filter(d => d.archiveCategory === cat).length} Berkas</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classifications */}
          {activeTab === 'classifications' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Master Klasifikasi Keamanan</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">+ Klasifikasi Baru</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Terbuka', 'Terbatas', 'Rahasia'].map(cls => (
                  <div key={cls} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <ShieldCheck className="w-8 h-8 text-blue-600 mb-3" />
                    <p className="font-black text-slate-800">{cls}</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Pengaturan akses level {cls}</p>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${cls === 'Rahasia' ? 'bg-red-500' : cls === 'Terbatas' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${(documents.filter(d => d.securityClassification === cls).length / documents.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Access Control */}
          {activeTab === 'access' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-6">Pengaturan Hak Akses Halaman</h3>
              <div className="space-y-4">
                {['SUPERADMIN', 'UNIT_ADMIN', 'VIEWER'].map(role => (
                  <div key={role} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">{role}</p>
                      <p className="text-xs text-slate-500">Izin akses untuk peran personil {role}</p>
                    </div>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">Atur Izin</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archive Codes */}
          {activeTab === 'archive-codes' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-200 font-sans">
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tabel Klasifikasi Kode Arsip</h3>
                  <p className="text-sm text-slate-500 font-medium tracking-tight">Berdasarkan PERMENKUMHAM No. 5 Tahun 2022 (Hal. 12-109)</p>
                </div>
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari kode, jenis, atau deskripsi..."
                    value={searchCodeQuery}
                    onChange={(e) => setSearchCodeQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode Utama</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode Sub</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis Arsip</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi / Penjelasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredCodes.length > 0 ? (
                      filteredCodes.map((item, idx) => (
                        <tr 
                          key={`${item.mainCode}-${item.subCode}-${idx}`} 
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              item.category === 'Fasilitatif' 
                                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm">
                              {item.mainCode}
                            </span>
                          </td>
                          <td className="px-8 py-5 font-mono text-sm font-bold text-slate-700">
                            {item.subCode}
                          </td>
                          <td className="px-8 py-5 text-sm font-black text-slate-800 leading-tight">
                            {item.archiveType}
                          </td>
                          <td className="px-8 py-5 text-xs font-medium text-slate-500 leading-relaxed max-w-md">
                            {item.description}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-32 text-center text-slate-400">
                          Tidak ada kode klasifikasi yang ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Management */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Manajemen Pengguna</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">+ User Baru</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Unit</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar} alt="" className="w-8 h-8 rounded-lg" />
                            <div>
                              <p className="text-sm font-bold">{u.name}</p>
                              <p className="text-[10px] text-slate-400">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded uppercase">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{u.processingUnit || 'Semua Unit'}</td>
                        <td className="px-4 py-3">
                          <button className="p-2 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                          <button className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Archive Form Modal */}
      {showForm && (
        <ArchiveForm
          archive={selectedDocForEdit}
          onSave={saveArchive}
          onClose={() => {
            setShowForm(false);
            setSelectedDocForEdit(null);
          }}
        />
      )}

      {showLoanForm && (
        <LoanFormModal
          archives={documents}
          onClose={() => setShowLoanForm(false)}
          onSave={createLoan}
        />
      )}

      {showReturnForm && selectedLoanForReturn && (
        <ReturnFormModal
          loan={selectedLoanForReturn}
          archive={documents.find(d => d.id === selectedLoanForReturn.archiveId)}
          onClose={() => {
            setShowReturnForm(false);
            setSelectedLoanForReturn(null);
          }}
          onSave={returnLoan}
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-3xl font-black text-slate-800">{value}</span>
    </div>
    <p className="text-sm text-slate-500">{title}</p>
  </div>
);

const ReportCard: React.FC<{
  title: string;
  value: number;
}> = ({ title, value }) => (
  <div className="bg-slate-50 p-4 rounded-xl">
    <p className="text-xs text-slate-500 mb-1">{title}</p>
    <p className="text-2xl font-black text-slate-800">{value}</p>
  </div>
);

export default App;