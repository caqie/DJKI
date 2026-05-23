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
  Download, Printer, FileText, Search, Filter, Plus, Eye, EyeOff, Edit, Trash2,
  Lock, Key, LogOut, User as UserIcon, ShieldCheck, Database, LayoutDashboard,
  QrCode, ScanLine, Archive as ArchiveIcon, X, ListTree, Shield, Building2, Camera, RefreshCw,
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, Clock, MapPin, FolderOpen, ArrowLeft, Settings, Save
} from 'lucide-react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { 
  Role, 
  ArchiveCategory, 
  SecurityClassification, 
  DocumentForm,
  User,
  RolePermissions,
  ModulePermission,
  IntellectualPropertyDoc as Archive,
  ArchiveBox,
  LoanRecord
} from './types';

// ======================================================
// TIPE DATA
// ======================================================
// Use types from ./types.ts

const DEFAULT_MODULES = [
  { id: 'dashboard', label: 'Dashboard', allowed: true },
  { id: 'archive-list', label: 'Daftar Arsip', allowed: true },
  { id: 'search', label: 'Pencarian', allowed: true },
  { id: 'loans', label: 'Peminjaman', allowed: false },
  { id: 'vault', label: 'Vault Rahasia', allowed: false },
  { id: 'labels', label: 'Cetak Label', allowed: false },
  { id: 'scanner', label: 'Scan QR', allowed: false },
  { id: 'reports', label: 'Laporan', allowed: false },
  { id: 'units', label: 'Unit Kerja', allowed: false },
  { id: 'categories', label: 'Kategori Arsip', allowed: false },
  { id: 'classifications', label: 'Keamanan', allowed: false },
  { id: 'archive-codes', label: 'Kode Klasifikasi', allowed: false },
  { id: 'users', label: 'Manajemen User', allowed: false },
  { id: 'access', label: 'Hak Akses', allowed: false },
  { id: 'settings', label: 'Pengaturan', allowed: false },
];

const INITIAL_PERMISSIONS: RolePermissions[] = [
  { role: 'SUPERADMIN', modules: DEFAULT_MODULES.map(m => ({ ...m, allowed: true })) },
  { role: 'ADMIN', modules: DEFAULT_MODULES.map(m => ({ ...m, allowed: !['access'].includes(m.id) })) },
  { role: 'OPERATOR', modules: DEFAULT_MODULES.map(m => ({ ...m, allowed: ['dashboard', 'archive-list', 'search', 'loans', 'labels', 'scanner', 'reports', 'units', 'categories', 'classifications', 'archive-codes'].includes(m.id) })) },
  { role: 'VIEWER', modules: DEFAULT_MODULES.map(m => ({ ...m, allowed: ['dashboard', 'archive-list', 'search'].includes(m.id) })) },
];

// ======================================================
// DATA CONSTANTS
// ======================================================
const DJKI_UNITS = [
  'Sekretariat',
  'Direktorat Merek dan Indikasi Geografis',
  'Direktorat Paten, DTLST, dan RD',
  'Direktorat Hak Cipta dan Desain Industri',
  'Direktorat Kerjasama dan Pemberdayaan Kekayaan Intelektual',
  'Direktorat Penyidikan dan Penyelesaian Sengketa',
  'Direktorat Teknologi Informasi'
];

const INITIAL_BOXES: ArchiveBox[] = [
  {
    id: 'box-1',
    boxNumber: 'BOX-2024-001',
    location: 'Gedung A, Lantai 1, Lemari C-01, Rak S-01',
    documentIds: ['1', '2'],
    processingUnit: 'Merek',
    yearRange: '2023-2024',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'box-2',
    boxNumber: 'BOX-2024-002',
    location: 'Gedung B, Lantai 2, Lemari C-05, Rak S-02',
    documentIds: ['3'],
    processingUnit: 'Sekretariat',
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
  applicant: "",
  inventor: "",
  creator: "",
  copyrightHolder: "",
  consultant: "",
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

  { mainCode: "KI", subCode: "01.01", archiveType: "Proses Pencatatan Ciptaan", description: "Dokumen proses penyelesaian permohonan pencatatan ciptaan.", category: "Substantif" },
  { mainCode: "KI", subCode: "01.01.01", archiveType: "Kekurangan Persyaratan Ciptaan", description: "Pemberitahuan kekurangan kelengkapan permohonan hak cipta.", category: "Substantif" },
  { mainCode: "KI", subCode: "01.02", archiveType: "Pasca Pencatatan Ciptaan", description: "Dokumen setelah ciptaan dicatatkan (perubahan, pengalihan, dll).", category: "Substantif" },
  { mainCode: "KI", subCode: "01.02.04", archiveType: "Pengalihan Hak Cipta", description: "Pencatatan pengalihan hak atas ciptaan.", category: "Substantif" },
  { mainCode: "KI", subCode: "01.02.05", archiveType: "Lisensi Ciptaan", description: "Pencatatan perjanjian lisensi hak cipta.", category: "Substantif" },
  { mainCode: "KI", subCode: "01.03", archiveType: "Pelayanan Hukum Cipta", description: "Pertimbangan, pendapat hukum, dan bantuan hukum perkara hak cipta.", category: "Substantif" },
  { mainCode: "KI", subCode: "01.04", archiveType: "Lembaga Manajemen Kolektif", description: "Dokumen ijin operasional dan evaluasi LMK.", category: "Substantif" },

  { mainCode: "KI", subCode: "02.01", archiveType: "Pendaftaran Desain Industri", description: "Proses penyelesaian permohonan pendaftaran desain industri.", category: "Substantif" },
  { mainCode: "KI", subCode: "02.01.12", archiveType: "Penolakan Desain Industri", description: "Keputusan penolakan permohonan desain industri.", category: "Substantif" },
  { mainCode: "KI", subCode: "02.03", archiveType: "Pasca Pendaftaran Desain Industri", description: "Perubahan data, pengalihan hak, lisensi desain industri.", category: "Substantif" },
  { mainCode: "KI", subCode: "02.04", archiveType: "Pelayanan Hukum Desain Industri", description: "Pendapat hukum dan bantuan hukum perkara desain industri.", category: "Substantif" },

  { mainCode: "KI", subCode: "03.01", archiveType: "Pendaftaran DTLST", description: "Proses penyelesaian permohonan pendaftaran Desain Tata Letak Sirkuit Terpadu.", category: "Substantif" },
  { mainCode: "KI", subCode: "03.02", archiveType: "Sertifikat/Kutipan DTLST", description: "Sertifikat dan kutipan daftar umum DTLST.", category: "Substantif" },

  { mainCode: "KI", subCode: "04.01", archiveType: "Rahasia Dagang", description: "Pencatatan lisensi dan dokumen rahasia dagang.", category: "Substantif" },

  { mainCode: "KI", subCode: "05.01", archiveType: "Pendaftaran Paten", description: "Proses penyelesaian permohonan pendaftaran paten.", category: "Substantif" },
  { mainCode: "KI", subCode: "05.01.08", archiveType: "Pemeriksaan Substantif Paten", description: "Dokumen hasil pemeriksaan substantif paten tahap awal/lanjut.", category: "Substantif" },
  { mainCode: "KI", subCode: "05.02", archiveType: "Sertifikat Paten", description: "Penerbitan dan pengambilan sertifikat paten.", category: "Substantif" },
  { mainCode: "KI", subCode: "05.04", archiveType: "Pemeliharaan Paten", description: "Pemenuhan kewajiban pembayaran biaya pemeliharaan paten.", category: "Substantif" },
  { mainCode: "KI", subCode: "05.11", archiveType: "Komisi Banding Paten", description: "Dokumen proses banding atas penolakan paten.", category: "Substantif" },

  { mainCode: "KI", subCode: "06.01", archiveType: "Pendaftaran Merek", description: "Proses penyelesaian permohonan pendaftaran merek.", category: "Substantif" },
  { mainCode: "KI", subCode: "06.01.06", archiveType: "Publikasi Merek", description: "Pengumuman/Berita Resmi Merek.", category: "Substantif" },
  { mainCode: "KI", subCode: "06.01.09", archiveType: "Pemeriksaan Substantif Merek", description: "Laporan hasil pemeriksaan substantif merek.", category: "Substantif" },
  { mainCode: "KI", subCode: "06.02", archiveType: "Sertifikat Merek", description: "Penerbitan sertifikat dan kutipan merek.", category: "Substantif" },
  { mainCode: "KI", subCode: "06.09", archiveType: "Perpanjangan Merek", description: "Proses perpanjangan masa perlindungan merek.", category: "Substantif" },
  { mainCode: "KI", subCode: "06.12", archiveType: "Komisi Banding Merek", description: "Permohonan banding terhadap penolakan merek.", category: "Substantif" },

  { mainCode: "KI", subCode: "07.01", archiveType: "Pendaftaran Indikasi Geografis", description: "Proses penyelesaian permohonan pendaftaran IG.", category: "Substantif" },
  { mainCode: "KI", subCode: "07.05", archiveType: "Pengawasan IG", description: "Dokumen pengawasan indikasi geografis terdaftar.", category: "Substantif" },

  { mainCode: "KI", subCode: "08.01", archiveType: "Penyidikan (PPNS)", description: "Pemberkasan perkara tindak pidana kekayaan intelektual.", category: "Substantif" },
  { mainCode: "KI", subCode: "08.01.01", archiveType: "Laporan Kejadian KI", description: "Laporan kejadian/pengaduan dugaan tindak pidana KI.", category: "Substantif" },
  { mainCode: "KI", subCode: "08.03", archiveType: "Penyelesaian Sengketa Alternatif", description: "Mediasi dan penyelesaian sengketa KI di luar pengadilan.", category: "Substantif" },

  { mainCode: "KI", subCode: "09.02", archiveType: "KI Komunal (KIK)", description: "Inventarisasi Kekayaan Intelektual Komunal (EBT, PTE, KSD).", category: "Substantif" },

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
    classificationCode: 'KI.06.01',
    documentForm: 'Asli',
    name: 'PT Kenangan Abadi',
    applicant: 'PT Kenangan Abadi',
    archiveType: 'Pendaftaran Merek',
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
    processingUnit: 'Merek',
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
    classificationCode: 'KI.05.01',
    documentForm: 'Salinan',
    name: 'Universitas Indonesia',
    applicant: 'Universitas Indonesia',
    inventor: 'UI Research',
    archiveType: 'Pendaftaran Paten',
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
    processingUnit: 'Paten',
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
    classificationCode: 'KP.02.01',
    documentForm: 'Scan',
    name: 'Budi Santoso',
    archiveType: 'Penerimaan Pegawai',
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
    processingUnit: 'Sekretariat',
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
    password: 'admin123',
    name: 'Super Admin DJKI',
    role: 'SUPERADMIN',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  },
  {
    id: 'admin-sekre',
    username: 'adminsekre',
    password: 'admin123',
    name: 'Admin Sekretariat',
    role: 'ADMIN',
    processingUnit: 'Sekretariat',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sekre'
  },
  {
    id: 'admin-merek',
    username: 'adminmerek',
    password: 'admin123',
    name: 'Admin Merek',
    role: 'ADMIN',
    processingUnit: 'Direktorat Merek dan Indikasi Geografis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'
  }
];

// ======================================================
// PERMISSION MODAL
// ======================================================
const PermissionModal: React.FC<{
  role: Role;
  permissions: RolePermissions[];
  onClose: () => void;
  onSave: (perms: RolePermissions) => void;
}> = ({ role, permissions, onClose, onSave }) => {
  const currentPerms = permissions.find(p => p.role === role) || { role, modules: DEFAULT_MODULES };
  const [data, setData] = useState<RolePermissions>(JSON.parse(JSON.stringify(currentPerms)));

  const toggleModule = (id: string) => {
    const updatedModules = data.modules.map(m => 
      m.id === id ? { ...m, allowed: !m.allowed } : m
    );
    setData({ ...data, modules: updatedModules });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Atur Izin Akses</h3>
            <p className="text-slate-500 text-sm font-medium">Mengatur modul yang dapat diakses oleh peran <span className="text-blue-600 font-bold">{role}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-200">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.modules.map((module) => (
              <div 
                key={module.id} 
                onClick={() => toggleModule(module.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  module.allowed 
                    ? 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-100' 
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    module.allowed ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}>
                    {module.allowed ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </div>
                  <span className={`text-sm font-bold ${module.allowed ? 'text-blue-900' : 'text-slate-600'}`}>{module.label}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all ${module.allowed ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${module.allowed ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white text-slate-600 rounded-2xl font-black text-sm border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button 
            onClick={() => {
              onSave(data);
              onClose();
            }}
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            Simpan Perubahan
          </button>
        </div>
      </motion.div>
    </div>
  );
};
const VaultLogin: React.FC<{ users: User[]; onLogin: (user: User) => void; logoUrl: string }> = ({ users, onLogin, logoUrl }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    
    const user = users.find(u => u.username === cleanUsername);
    if (user && (user.password === cleanPassword || (!user.password && cleanPassword === 'admin123'))) {
      setIsOpening(true);
      
      // Wait for vault opening animation (2.5s)
      setTimeout(() => {
        onLogin(user);
      }, 2500);
    } else {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24"
        >
          <Settings className="w-96 h-96 text-blue-400" />
        </motion.div>
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-48 -right-48"
        >
          <Settings className="w-[32rem] h-[32rem] text-blue-400" />
        </motion.div>
        <div className="absolute top-1/4 right-1/4">
          <ArchiveIcon className="w-16 h-16 text-blue-500 opacity-20" />
        </div>
        <div className="absolute bottom-1/4 left-1/3">
          <FileText className="w-12 h-12 text-blue-400 opacity-10" />
        </div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]"></div>
      
      <AnimatePresence mode="wait">
        {!isOpening ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-10 w-full max-w-md border border-white/20 relative z-10"
          >
            {/* Logo and Header */}
            <div className="text-center mb-10">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="inline-block p-4 bg-white rounded-3xl shadow-xl border border-slate-100 mb-6"
              >
                <img 
                  src={logoUrl} 
                  alt="Logo DJKI" 
                  className="h-16 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/identicon/svg?seed=DJKI';
                  }}
                />
              </motion.div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter">PORTAL ARSIP</h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className="h-[1px] w-4 bg-blue-600"></div>
                <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">Direktorat Jenderal KI</p>
                <div className="h-[1px] w-4 bg-blue-600"></div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="Username Anda"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kunci Akses</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-50 text-red-500 text-[11px] font-bold rounded-xl flex items-center gap-2 border border-red-100"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                className="w-full group relative py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-500/30 overflow-hidden active:scale-95 flex items-center justify-center gap-3"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="relative z-10"
                >
                  <Settings className="w-4 h-4" />
                </motion.div>
                <span className="relative z-10">Buka Brankas Digital</span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Sistem Manajemen Arsip Terenkripsi • v2.0
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="vault-opening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center z-20"
          >
            {/* Vault Door Animation */}
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* Outer Ring */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 border-[12px] border-[#333] rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]"
              ></motion.div>
              
              {/* Inner Gear */}
              <motion.div 
                animate={{ rotate: -180 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute inset-8 border-[8px] border-dashed border-[#444] rounded-full"
              ></motion.div>

              {/* Vault Handle */}
              <motion.div 
                initial={{ rotate: 0 }}
                animate={{ rotate: 720 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="relative w-48 h-48 bg-gradient-to-br from-[#444] to-[#222] rounded-full shadow-2xl flex items-center justify-center border-4 border-[#555]"
              >
                <div className="w-4 h-32 bg-[#333] absolute rounded-full"></div>
                <div className="w-32 h-4 bg-[#333] absolute rounded-full"></div>
                <div className="w-16 h-16 bg-[#222] rounded-full border-4 border-[#444] flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>
                </div>
              </motion.div>

              {/* Status Text */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-20 text-center"
              >
                <p className="text-blue-400 font-black text-xl tracking-widest uppercase animate-pulse">Akses Diterima</p>
                <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest">Membuka Brankas Arsip...</p>
              </motion.div>
            </div>

            {/* Light Beam Effect */}
            <motion.div 
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="fixed inset-0 bg-white z-50 origin-center"
            ></motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  logoUrl: string;
  rolePermissions: RolePermissions[];
}> = ({ activeTab, setActiveTab, isOpen, setIsOpen, isCollapsed, setIsCollapsed, user, onLogout, logoUrl, rolePermissions }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'archive-list', label: 'Daftar Arsip', icon: ArchiveIcon },
    { id: 'search', label: 'Pencarian', icon: Search },
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

  const allowedMenuItems = useMemo(() => {
    if (user?.role === 'SUPERADMIN') return menuItems;
    return menuItems.filter(item => {
      if (!user) return false;
      if (!rolePermissions || rolePermissions.length === 0) return true;
      
      const perms = rolePermissions.find(p => p.role === user.role);
      if (!perms) return true;
      
      const module = perms.modules.find(m => m.id === item.id);
      return module ? module.allowed : false;
    });
  }, [user, rolePermissions]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      <aside
        className={`fixed top-0 left-0 h-full bg-[#0f172a] text-white z-[70] border-r border-slate-800 transition-all duration-300 shadow-2xl flex flex-col ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header/Logo Section */}
        <div className="p-6 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 scale-0' : 'opacity-100 w-auto scale-100'}`}>
              <motion.div 
                whileTap={{ scale: 0.9 }}
                className="shine-effect w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 p-1.5 border border-blue-200/50 cursor-pointer shadow-sm"
              >
                <img 
                  src={logoUrl} 
                  alt="DJKI" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/identicon/svg?seed=DJKI';
                  }}
                  className="w-full h-full object-contain relative z-10"
                />
              </motion.div>
              <div className="min-w-[120px]">
                <h1 className="font-black text-xs tracking-tight leading-none">PORTAL ARSIP</h1>
                <p className="text-[8px] text-blue-400 font-bold tracking-widest mt-0.5 uppercase">Direktorat Jenderal KI</p>
              </div>
            </div>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              {isCollapsed ? <ListTree className="w-5 h-5 mx-auto" /> : <X className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          {allowedMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              title={isCollapsed ? item.label : ""}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all group relative
                ${activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'text-white' : 'group-hover:text-blue-400'} transition-all ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isCollapsed && (
                 <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1e293b] text-white text-[10px] rounded-lg shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 font-black">
                   {item.label}
                 </div>
              )}
            </button>
          ))}
        </nav>

        {/* Profile & Footer Section */}
        <div className="p-4 border-t border-slate-800/50 bg-[#0f172a]">
          {!isCollapsed && (
            <div className="pt-2 text-center">
              <p className="text-[7px] text-slate-500 font-black uppercase tracking-[0.3em]">Created By</p>
              <p className="text-[9px] text-blue-400/60 font-black mt-0.5 uppercase tracking-widest hover:text-blue-400 transition-colors cursor-default">caqiestudioproduction</p>
            </div>
          )}
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
  units: string[];
  categories: string[];
  classifications: string[];
  currentUser: User | null;
  onSave: (archive: Archive) => void;
  onClose: () => void;
}> = ({ archive, units, categories, classifications, currentUser, onSave, onClose }) => {
  const [data, setData] = useState<Archive>(() => {
    const base = archive || { ...EMPTY_ARCHIVE, id: crypto.randomUUID() };
    const isAdmin = currentUser?.role === 'ADMIN';
    if (!archive && currentUser?.processingUnit && (isAdmin || currentUser?.role === 'OPERATOR')) {
      return { ...base, processingUnit: currentUser.processingUnit };
    }
    return base;
  });
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
                <SelectField name="archiveCategory" label="Kategori" value={data.archiveCategory} onChange={handleChange} options={categories} />
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
                {data.classificationCode.startsWith('KI') ? (
                  <>
                    {data.classificationCode.startsWith('KI.05') ? (
                      <>
                        <InputField name="applicant" label="Pemohon" value={data.applicant || ''} onChange={handleChange} placeholder="Nama Pemohon Paten" required />
                        <InputField name="inventor" label="Inventor" value={data.inventor || ''} onChange={handleChange} placeholder="Nama Inventor" required />
                      </>
                    ) : data.classificationCode.startsWith('KI.01') ? (
                      <>
                        <InputField name="creator" label="Pencipta" value={data.creator || ''} onChange={handleChange} placeholder="Nama Pencipta" required />
                        <InputField name="copyrightHolder" label="Pemegang Hak Cipta" value={data.copyrightHolder || ''} onChange={handleChange} placeholder="Nama Pemegang Hak Cipta" required />
                      </>
                    ) : (data.classificationCode.startsWith('KI.02') || data.classificationCode.startsWith('KI.06')) ? (
                      <InputField name="applicant" label="Pemohon" value={data.applicant || ''} onChange={handleChange} placeholder="Nama Pemohon" required />
                    ) : (
                      <InputField name="applicant" label="Pemohon" value={data.applicant || ''} onChange={handleChange} placeholder="Nama Pemohon" />
                    )}
                    <InputField name="consultant" label="Kuasa / Konsultan" value={data.consultant || ''} onChange={handleChange} placeholder="Nama Kuasa atau Konsultan" />
                  </>
                ) : (
                  <InputField name="name" label="Nama / Identitas" value={data.name} onChange={handleChange} placeholder="Nama Lengkap / Identitas" required />
                )}
                
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
                <SelectField name="securityClassification" label="Klasifikasi Keamanan" value={data.securityClassification} onChange={handleChange} options={classifications} />
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
                <SelectField 
                  name="processingUnit" 
                  label="Unit Pengolah" 
                  value={data.processingUnit} 
                  onChange={handleChange} 
                  options={units} 
                  disabled={!!currentUser?.processingUnit && (currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERATOR')}
                />
                
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
  disabled?: boolean;
}> = ({ name, label, value, onChange, placeholder, type = 'text', required, disabled }) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100"
    />
  </div>
);

const SelectField: React.FC<{
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  disabled?: boolean;
}> = ({ name, label, value, onChange, options, disabled }) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100"
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
  canEdit: boolean;
  currentUser: User | null;
}> = ({ archive, onClose, onEdit, canEdit, currentUser }) => {
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
            <ArchiveIcon className="w-12 h-12 text-white" />
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
            <DetailItem label="Bentuk Fisik" value={archive.documentForm} icon={ArchiveIcon} />
            <DetailItem label="Masa Retensi" value={archive.retentionPeriod} icon={RefreshCw} />
            
            {/* KI Specific Details */}
            {archive.classificationCode.startsWith('KI') && (
              <>
                {archive.applicant && <DetailItem label="Pemohon" value={archive.applicant} icon={UserIcon} />}
                {archive.inventor && <DetailItem label="Inventor" value={archive.inventor} icon={UserIcon} />}
                {archive.creator && <DetailItem label="Pencipta" value={archive.creator} icon={UserIcon} />}
                {archive.copyrightHolder && <DetailItem label="Pemegang Hak Cipta" value={archive.copyrightHolder} icon={UserIcon} />}
                {archive.consultant && <DetailItem label="Kuasa / Konsultan" value={archive.consultant} icon={ShieldCheck} />}
              </>
            )}
            {!archive.classificationCode.startsWith('KI') && archive.name && (
              <DetailItem label="Nama / Identitas" value={archive.name} icon={UserIcon} />
            )}
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
            {canEdit && (
              <button 
                onClick={() => onEdit(archive)}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                <Edit className="w-4 h-4" /> Edit Metadata
              </button>
            )}
            {currentUser?.role !== 'VIEWER' && (
              <button 
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all font-sans"
                onClick={() => {
                  if (archive.fileUrl) window.open(archive.fileUrl, '_blank');
                  else alert('File PDF belum diunggah.');
                }}
              >
                <Eye className="w-4 h-4" /> Lihat Berkas PDF
              </button>
            )}
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
  units: string[];
  onClose: () => void;
  onSave: (docId: string, name: string, nip: string, unit: string, notes: string) => void;
}> = ({ archives, units, onClose, onSave }) => {
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
              {units.map(unitOption => (
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
                <ArchiveIcon className="w-6 h-6" />
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

// ======================================================
// SHARED COMPONENTS
// ======================================================
const ArchiveTable: React.FC<{
  data: Archive[];
  onDetail: (doc: Archive) => void;
  onEdit: (doc: Archive) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}> = ({ data, onDetail, onEdit, onDelete, canEdit, canDelete }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-slate-50/50 border-y border-slate-100">
          <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">No Berkas</th>
          <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Identitas</th>
          <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi Simpan</th>
          <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
          <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {data.map((doc) => (
          <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors group">
            <td className="px-4 py-4 text-xs font-mono font-bold text-blue-600">{doc.fileNumber}</td>
            <td className="px-4 py-4 truncate max-w-[200px]">
              <p className="text-sm font-bold text-slate-700 leading-tight">
                {doc.classificationCode.startsWith('KI') ? (doc.applicant || doc.creator || doc.name) : doc.name}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">{doc.archiveType}</p>
            </td>
            <td className="px-4 py-4">
              <p className="text-xs font-bold text-slate-600">{doc.building}</p>
              <p className="text-[10px] text-slate-400 font-medium">Lantai {doc.floor} • Box {doc.boxNumber || '-'}</p>
            </td>
            <td className="px-4 py-4">
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                doc.archiveCategory === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                doc.archiveCategory === 'Vital' ? 'bg-red-50 text-red-600 border border-red-100' :
                doc.archiveCategory === 'Inaktif' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                'bg-slate-50 text-slate-500 border border-slate-100'
              }`}>
                {doc.archiveCategory}
              </span>
            </td>
            <td className="px-4 py-4">
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onDetail(doc)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Lihat Detail"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => onEdit(doc)}
                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="Ubah Data"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                    title="Hapus Permanen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

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

const ManagementModal: React.FC<{
  title: string;
  placeholder: string;
  initialValue: string | null;
  onSave: (old: string | null, newVal: string) => void;
  onClose: () => void;
}> = ({ title, placeholder, initialValue, onSave, onClose }) => {
  const [value, setValue] = useState(initialValue || '');
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-black text-slate-800 mb-6">{title}</h3>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Batal</button>
          <button onClick={() => onSave(initialValue, value)} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all text-sm">Simpan</button>
        </div>
      </motion.div>
    </div>
  );
};

const UserFormModal: React.FC<{
  user: User | null;
  units: string[];
  roles: RolePermissions[];
  currentUser: User | null;
  onSave: (user: User) => void;
  onClose: () => void;
}> = ({ user, units, roles, currentUser, onSave, onClose }) => {
  const [data, setData] = useState<User>(user || {
    id: crypto.randomUUID(),
    username: '',
    password: '',
    name: '',
    role: 'OPERATOR',
    processingUnit: currentUser?.role === 'SUPERADMIN' ? '' : (currentUser?.processingUnit || units[0]),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
  });
  const [showPass, setShowPass] = useState(false);

  const availableRoles = useMemo(() => {
    if (currentUser?.role === 'SUPERADMIN') return roles;
    // Unit Admins can manage ADMIN, OPERATOR, or VIEWER (restricted to their unit automatically)
    return roles.filter(r => ['ADMIN', 'OPERATOR', 'VIEWER'].includes(r.role));
  }, [roles, currentUser]);

  const availableUnits = useMemo(() => {
    if (currentUser?.role === 'SUPERADMIN') return units;
    return units.filter(u => u === currentUser?.processingUnit);
  }, [units, currentUser]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-black text-slate-800 mb-6">{user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Nama Lengkap</label>
            <input type="text" value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Username</label>
            <input type="text" value={data.username} onChange={e => setData({...data, username: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
          </div>
          {!user && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Password</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"} 
                  value={data.password} 
                  onChange={e => setData({...data, password: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Role</label>
            <select value={data.role} onChange={e => setData({...data, role: e.target.value as Role})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm">
              {availableRoles.map(r => (
                <option key={r.role} value={r.role}>
                  {r.role.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Unit Kerja</label>
            <select 
              value={data.processingUnit} 
              onChange={e => setData({...data, processingUnit: e.target.value})} 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm disabled:opacity-60"
              disabled={currentUser?.role !== 'SUPERADMIN'}
            >
              <option value="">Semua Unit</option>
              {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Batal</button>
          <button onClick={() => onSave(data)} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all text-sm">Simpan</button>
        </div>
      </motion.div>
    </div>
  );
};

const ChangePasswordModal: React.FC<{
  user: User;
  onSave: (userId: string, newPass: string) => void;
  onClose: () => void;
}> = ({ user, onSave, onClose }) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-black text-slate-800 mb-2">Ganti Password</h3>
        <p className="text-xs text-slate-400 font-bold mb-6 uppercase tracking-tight">Pengguna: {user.name} (@{user.username})</p>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Password Baru</label>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"} 
                autoFocus 
                value={newPass} 
                onChange={e => setNewPass(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Konfirmasi Password</label>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"} 
                value={confirmPass} 
                onChange={e => setConfirmPass(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm pr-10" 
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Batal</button>
          <button 
            disabled={!newPass || newPass !== confirmPass}
            onClick={() => onSave(user.id, newPass)} 
            className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Password
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ======================================================
// MAIN APP COMPONENT
// ======================================================
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [webSettings, setWebSettings] = useState<any>({
    siteName: 'Portal Arsip DJKI',
    department: 'Direktorat Jenderal Kekayaan Intelektual',
    maintenanceMode: false,
    logoUrl: 'https://lh3.googleusercontent.com/d/1he5AoYAHMd9dlg47zLlR_-vSX_tQ9u95',
    theme: 'system',
    autoBackup: true,
    retentionPolicy: 'Permanen',
    ocrEnabled: true,
    maxUploadSize: '10MB',
    sessionTimeout: '60 Menit',
    googleSheetsSpreadsheetId: '',
    googleSheetsConnectedEmail: '',
    googleSheetsAutoSync: false
  });
  const [documents, setDocuments] = useState<Archive[]>([]);
  const [boxes, setBoxes] = useState<ArchiveBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<ArchiveBox | null>(null);
  const [selectedArchiveForLabel, setSelectedArchiveForLabel] = useState<Archive | null>(null);
  const [labelMode, setLabelMode] = useState<'box' | 'berkas'>('box');
  const [searchLabel, setSearchLabel] = useState('');
  const [units, setUnits] = useState<string[]>(DJKI_UNITS);
  const [categories, setCategories] = useState<string[]>(['Aktif', 'Inaktif', 'Statis', 'Vital']);
  const [classifications, setClassifications] = useState<string[]>(['Terbuka', 'Terbatas', 'Rahasia']);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>(INITIAL_PERMISSIONS);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<Role | null>(null);
  const [showPermsModal, setShowPermsModal] = useState(false);
  
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterLocation, setFilterLocation] = useState('Semua');
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [filterYear, setFilterYear] = useState('Semua');
  const [searchCodeQuery, setSearchCodeQuery] = useState('');
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<Archive | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<string | null>(null);
  const [showClassificationForm, setShowClassificationForm] = useState(false);
  const [selectedClassificationForEdit, setSelectedClassificationForEdit] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [showChangePassForm, setShowChangePassForm] = useState(false);
  const [selectedUserForPass, setSelectedUserForPass] = useState<User | null>(null);
  const [scannedData, setScannedData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<LoanRecord | null>(null);
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<Archive | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reportPeriod, setReportPeriod] = useState('Semua');
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [googleSheetsToken, setGoogleSheetsToken] = useState<string | null>(null);
  const [googleSheetsUserEmail, setGoogleSheetsUserEmail] = useState<string | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [sheetsSyncError, setSheetsSyncError] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  const handleConnectGoogleSheets = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Gagal mendapatkan token akses dari Google.');
      }
      
      setGoogleSheetsToken(credential.accessToken);
      setGoogleSheetsUserEmail(result.user.email);
      
      // Update config settings
      const updatedSettings = {
        ...webSettings,
        googleSheetsConnectedEmail: result.user.email || ''
      };
      setWebSettings(updatedSettings);
      
      // If superadmin, save metadata to firestore
      if (currentUser?.role === 'SUPERADMIN') {
        const docRef = doc(db, 'settings', 'config');
        await setDoc(docRef, updatedSettings, { merge: true });
      }
      
      alert(`Berhasil terhubung ke akun Google: ${result.user.email}`);
    } catch (err: any) {
      console.error('Error connecting Google Sheets:', err);
      alert(`Gagal menghubungkan Google Sheets: ${err.message || err}`);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!googleSheetsToken) {
      alert("Silakan hubungkan akun Google Anda terlebih dahulu.");
      return;
    }
    
    setIsSyncingSheets(true);
    setSheetsSyncStatus('syncing');
    setSheetsSyncError(null);
    
    try {
      const title = `Arsip Digital DJKI - ${webSettings.department || 'Direktorat Jenderal Kekayaan Intelektual'}`;
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleSheetsToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title
          }
        })
      });
      
      if (!res.ok) {
        throw new Error("Gagal membuat Spreadsheet baru di Google Drive Anda.");
      }
      
      const data = await res.json();
      const newSpreadsheetId = data.spreadsheetId;
      
      const updatedSettings = {
        ...webSettings,
        googleSheetsSpreadsheetId: newSpreadsheetId
      };
      setWebSettings(updatedSettings);
      
      if (currentUser?.role === 'SUPERADMIN') {
        const docRef = doc(db, 'settings', 'config');
        await setDoc(docRef, updatedSettings, { merge: true });
      }
      
      setSheetsSyncStatus('idle');
      alert(`Berhasil membuat Google Spreadsheet baru! ID: ${newSpreadsheetId}`);
    } catch (err: any) {
      console.error('Error creating Spreadsheet:', err);
      setSheetsSyncStatus('error');
      setSheetsSyncError(err.message || String(err));
      alert(`Gagal membuat Spreadsheet: ${err.message || err}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleSyncToSheets = async () => {
    const spreadsheetId = webSettings.googleSheetsSpreadsheetId;
    if (!googleSheetsToken) {
      alert("Silakan hubungkan akun Google Anda terlebih dahulu.");
      return;
    }
    if (!spreadsheetId) {
      alert("Masukkan ID Spreadsheet atau buat Spreadsheet baru terlebih dahulu.");
      return;
    }
    
    setIsSyncingSheets(true);
    setSheetsSyncStatus('syncing');
    setSheetsSyncError(null);
    
    try {
      // Get Spreadsheet sheets metadata safely
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${googleSheetsToken}` }
      });
      
      if (!metaRes.ok) {
        throw new Error("ID Spreadsheet tidak ditemukan, pastikan Anda memiliki akses ke berkas tersebut.");
      }
      
      const metaData = await metaRes.json();
      const sheetTitle = metaData.sheets?.[0]?.properties?.title || "Sheet1";
      
      const headers = [
        "Nomor Berkas", 
        "Nomor Item Arsip", 
        "Nomor Box", 
        "Kode Klasifikasi", 
        "Bentuk Dokumen",
        "Nama Dokumen", 
        "Pemohon / Pencipta", 
        "Jenis Arsip", 
        "Deskripsi", 
        "Nomor Registrasi",
        "Tanggal Dokumen", 
        "Kategori Arsip", 
        "Keamanan Akses", 
        "Lokasi Penyimpanan", 
        "Tahun"
      ];
      
      const rows = documents.map(doc => [
        doc.fileNumber || "-",
        doc.archiveItemNumber || "-",
        doc.boxNumber || "-",
        doc.classificationCode || "-",
        doc.documentForm || "-",
        doc.name || "-",
        doc.applicant || doc.creator || doc.copyrightHolder || "-",
        doc.archiveType || "-",
        doc.archiveDescription || "-",
        doc.documentNumber || "-",
        doc.documentDate || "-",
        doc.archiveCategory || "-",
        doc.securityClassification || "-",
        `${doc.building || "-"}, Lt.${doc.floor || "-"}, Lemari ${doc.cabinet || "-"}, Rak ${doc.shelf || "-"}, Map ${doc.mapOrFolder || "-"}`,
        doc.archiveYear || "-"
      ]);
      
      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetTitle}'!A1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${googleSheetsToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range: `'${sheetTitle}'!A1`,
            majorDimension: 'ROWS',
            values: [headers, ...rows]
          })
        }
      );
      
      if (!updateRes.ok) {
        throw new Error("Gagal menulis data arsip ke spreadsheet.");
      }
      
      setSheetsSyncStatus('success');
      setLastSyncedTime(new Date().toLocaleTimeString('id-ID'));
      alert("Sinkronisasi seluruh arsip digital ke Google Sheets sukses!");
    } catch (err: any) {
      console.error('Error syncing Google Sheets:', err);
      setSheetsSyncStatus('error');
      setSheetsSyncError(err.message || String(err));
      alert(`Gagal sinkronisasi data: ${err.message || err}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    const next = new Set(visiblePasswords);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setVisiblePasswords(next);
  };

  // Firestore synchronization
  useEffect(() => {
    if (!isLoggedIn) return;

    const unsubDocs = onSnapshot(collection(db, 'documents'), (snapshot) => {
      const docsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Archive));
      setDocuments(docsData.length > 0 ? docsData : INITIAL_DOCS);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'documents'));

    const unsubBoxes = onSnapshot(collection(db, 'boxes'), (snapshot) => {
      const boxesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ArchiveBox));
      setBoxes(boxesData.length > 0 ? boxesData : INITIAL_BOXES);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'boxes'));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
      
      // Merge initial users with firestore data to avoid losing default accounts
      const merged = [...INITIAL_USERS];
      usersData.forEach(ud => {
        const idx = merged.findIndex(mu => mu.id === ud.id || (ud.username && mu.username === ud.username));
        if (idx > -1) {
          merged[idx] = { ...merged[idx], ...ud };
        } else {
          merged.push(ud);
        }
      });
      setUsers(merged);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    const unsubLoans = onSnapshot(collection(db, 'loans'), (snapshot) => {
      const loansData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LoanRecord));
      setLoans(loansData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'loans'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) setWebSettings(snapshot.data());
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/config'));

    const unsubUnits = onSnapshot(doc(db, 'settings', 'units'), (snapshot) => {
      if (snapshot.exists()) setUnits(snapshot.data().items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/units'));

    const unsubCategories = onSnapshot(doc(db, 'settings', 'categories'), (snapshot) => {
      if (snapshot.exists()) setCategories(snapshot.data().items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/categories'));

    const unsubClassifications = onSnapshot(doc(db, 'settings', 'classifications'), (snapshot) => {
      if (snapshot.exists()) setClassifications(snapshot.data().items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/classifications'));

    const unsubPerms = onSnapshot(collection(db, 'permissions'), (snapshot) => {
      const permsData = snapshot.docs.map(d => d.data() as RolePermissions);
      if (permsData.length > 0) setRolePermissions(permsData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'permissions'));

    return () => {
      unsubDocs();
      unsubBoxes();
      unsubUsers();
      unsubLoans();
      unsubSettings();
      unsubUnits();
      unsubCategories();
      unsubClassifications();
      unsubPerms();
    };
  }, [isLoggedIn]);

  // Synchronize filterUnit with unit admin's processingUnit
  useEffect(() => {
    const isAdmin = currentUser?.role === 'ADMIN';
    if (currentUser?.processingUnit && (isAdmin || currentUser?.role === 'OPERATOR')) {
      if (filterUnit !== currentUser.processingUnit) {
        setFilterUnit(currentUser.processingUnit);
      }
    }
  }, [currentUser, filterUnit]);

  const handleSaveSettings = async () => {
    if (!isLoggedIn || currentUser?.role !== 'SUPERADMIN') return;
    try {
      await setDoc(doc(db, 'settings', 'config'), webSettings);
      alert("Pengaturan sistem berhasil diperbarui!");
    } catch (err) {
      console.error("Failed to sync settings:", err);
      alert("Gagal memperbarui pengaturan sistem.");
    }
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Clear detail view when tab changes
  useEffect(() => {
    setSelectedDocForDetail(null);
  }, [activeTab]);

  // Tab permission enforcement
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const isAllowed = (tab: string) => {
        if (currentUser.role === 'SUPERADMIN') return true;
        const perms = rolePermissions.find(p => p.role === currentUser.role);
        if (!perms) return false;
        const module = perms.modules.find(m => m.id === tab);
        return module ? module.allowed : false;
      };

      if (!isAllowed(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, currentUser, isLoggedIn, rolePermissions]);

  // Filter documents
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // Strict Unit-based filtering for ADMIN and OPERATOR
      const isAdmin = currentUser?.role === 'ADMIN';
      if (isAdmin || currentUser?.role === 'OPERATOR') {
        if (currentUser.processingUnit && doc.processingUnit !== currentUser.processingUnit) {
          return false;
        }
      }

      const isAuthorized = currentUser?.role === 'SUPERADMIN' || 
        doc.processingUnit === currentUser?.processingUnit ||
        doc.securityClassification !== 'Rahasia';
      
      if (!isAuthorized) return false;

      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = 
        doc.archiveDescription.toLowerCase().includes(searchStr) || 
        doc.documentNumber.toLowerCase().includes(searchStr) ||
        doc.name.toLowerCase().includes(searchStr) ||
        (doc.applicant?.toLowerCase().includes(searchStr)) ||
        (doc.inventor?.toLowerCase().includes(searchStr)) ||
        (doc.creator?.toLowerCase().includes(searchStr)) ||
        (doc.copyrightHolder?.toLowerCase().includes(searchStr)) ||
        (doc.consultant?.toLowerCase().includes(searchStr)) ||
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
    const stats = units.map(unit => ({
      name: unit,
      count: documents.filter(d => d.processingUnit === unit).length
    }));
    return currentUser?.role === 'SUPERADMIN' 
      ? stats 
      : stats.filter(s => s.name === currentUser?.processingUnit);
  }, [documents, units, currentUser]);

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
  const saveArchive = async (archive: Archive) => {
    try {
      await setDoc(doc(db, 'documents', archive.id), {
        ...archive,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setShowForm(false);
      setSelectedDocForEdit(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `documents/${archive.id}`);
    }
  };

  // Delete archive
  const deleteArchive = async (id: string) => {
    if (currentUser?.role !== 'SUPERADMIN') {
      alert('Hanya Super Admin yang dapat menghapus arsip.');
      return;
    }
    if (window.confirm('Apakah Anda yakin ingin menghapus arsip ini?')) {
      try {
        await deleteDoc(doc(db, 'documents', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `documents/${id}`);
      }
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
        processingUnit: row['Unit'] || units[0],
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
  const createLoan = async (archiveId: string, borrowerName: string, borrowerNip: string, borrowerUnit: string, notes: string) => {
    const loanId = crypto.randomUUID();
    const loan: LoanRecord = {
      id: loanId,
      archiveId,
      borrowerName,
      borrowerNip,
      borrowerUnit,
      loanDate: new Date().toISOString(),
      status: 'Dipinjam',
      notes
    };
    try {
      await setDoc(doc(db, 'loans', loanId), loan);
      setShowLoanForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'loans');
    }
  };

  const returnLoan = async (loanId: string, notes: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    
    try {
      await updateDoc(doc(db, 'loans', loanId), {
        status: 'Dikembalikan',
        returnDate: new Date().toISOString(),
        notes: `${loan.notes}\n\n[Kembali]: ${notes}`
      });
      setShowReturnForm(false);
      setSelectedLoanForReturn(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `loans/${loanId}`);
    }
  };

  // Unit CRUD
  const saveUnit = async (oldName: string | null, newName: string) => {
    if (!newName.trim()) return;
    let newItems = [...units];
    if (oldName) {
      newItems = newItems.map(u => u === oldName ? newName : u);
      // Update linked docs unit
      documents.filter(d => d.processingUnit === oldName).forEach(async (d) => {
        try {
          await updateDoc(doc(db, 'documents', d.id), { processingUnit: newName });
        } catch (e) {}
      });
    } else {
      if (units.includes(newName)) {
        alert('Unit sudah ada');
        return;
      }
      newItems.push(newName);
    }
    
    try {
      await setDoc(doc(db, 'settings', 'units'), { items: newItems });
      setShowUnitForm(false);
      setSelectedUnitForEdit(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/units');
    }
  };

  const deleteUnit = async (unitName: string) => {
    const hasArchives = documents.some(d => d.processingUnit === unitName);
    if (hasArchives) {
      alert('Tidak dapat menghapus unit yang masih memiliki arsip. Pindahkan arsip terlebih dahulu.');
      return;
    }
    if (window.confirm(`Hapus unit ${unitName}?`)) {
      try {
        await setDoc(doc(db, 'settings', 'units'), { items: units.filter(u => u !== unitName) });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/units');
      }
    }
  };

  // Category CRUD
  const saveCategory = async (oldName: string | null, newName: string) => {
    if (!newName.trim()) return;
    let newItems = [...categories];
    if (oldName) {
      newItems = newItems.map(c => c === oldName ? newName : c);
    } else {
      if (categories.includes(newName)) {
        alert('Kategori sudah ada');
        return;
      }
      newItems.push(newName);
    }
    
    try {
      await setDoc(doc(db, 'settings', 'categories'), { items: newItems });
      setShowCategoryForm(false);
      setSelectedCategoryForEdit(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/categories');
    }
  };

  const deleteCategory = async (catName: string) => {
    if (window.confirm(`Hapus kategori ${catName}?`)) {
      try {
        await setDoc(doc(db, 'settings', 'categories'), { items: categories.filter(c => c !== catName) });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/categories');
      }
    }
  };

  // Classification CRUD
  const saveClassification = async (oldName: string | null, newName: string) => {
    if (!newName.trim()) return;
    let newItems = [...classifications];
    if (oldName) {
      newItems = newItems.map(c => c === oldName ? newName : c);
    } else {
      if (classifications.includes(newName)) {
        alert('Klasifikasi sudah ada');
        return;
      }
      newItems.push(newName);
    }
    
    try {
      await setDoc(doc(db, 'settings', 'classifications'), { items: newItems });
      setShowClassificationForm(false);
      setSelectedClassificationForEdit(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/classifications');
    }
  };

  const deleteClassification = async (clsName: string) => {
    if (window.confirm(`Hapus klasifikasi ${clsName}?`)) {
      try {
        await setDoc(doc(db, 'settings', 'classifications'), { items: classifications.filter(c => c !== clsName) });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/classifications');
      }
    }
  };

  // User CRUD
  const saveUser = async (user: User) => {
    try {
      // Clean up whitespace
      const cleanedUser = {
        ...user,
        username: user.username.trim(),
        name: user.name.trim()
      };
      await setDoc(doc(db, 'users', cleanedUser.id), cleanedUser, { merge: true });
      setShowUserForm(false);
      setSelectedUserForEdit(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    }
  };

  const deleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri');
      return;
    }
    if (window.confirm('Hapus pengguna ini?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
      }
    }
  };

  const changeUserPassword = async (id: string, newPass: string) => {
    const userToUpdate = users.find(u => u.id === id);
    if (!userToUpdate) return;
    try {
      await setDoc(doc(db, 'users', id), { ...userToUpdate, password: newPass }, { merge: true });
      setShowChangePassForm(false);
      setSelectedUserForPass(null);
      alert('Password berhasil diperbarui');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
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
    return <VaultLogin users={users} onLogin={handleLogin} logoUrl={webSettings.logoUrl} />;
  }

  const isAdmin = currentUser?.role === 'ADMIN';
  const canEdit = currentUser?.role === 'SUPERADMIN' || isAdmin || currentUser?.role === 'OPERATOR';
  const canDelete = currentUser?.role === 'SUPERADMIN';
  const canManageUsers = currentUser?.role === 'SUPERADMIN' || isAdmin;
  const canAccessVault = currentUser?.role === 'SUPERADMIN';
  const isGuest = currentUser?.role === 'VIEWER';

  const savePermissions = async (perms: RolePermissions) => {
    try {
      await setDoc(doc(db, 'permissions', perms.role), perms);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `permissions/${perms.role}`);
    }
  };

  const isTabAllowed = (tab: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPERADMIN') return true;
    const perms = rolePermissions.find(p => p.role === currentUser.role);
    if (!perms) return false;
    const module = perms.modules.find(m => m.id === tab);
    return module ? module.allowed : false;
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        user={currentUser}
        onLogout={handleLogout}
        logoUrl={webSettings.logoUrl}
        rolePermissions={rolePermissions}
      />

      <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* Header - Fixed */}
        <header className="shrink-0 bg-white p-4 lg:px-8 border-b border-slate-200 z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 bg-white rounded-xl shadow-sm border border-slate-100"
              >
                ☰
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">
                  {activeTab === 'dashboard' && 'Dashboard Overview'}
                  {activeTab === 'archive-list' && 'Daftar Arsip Digital'}
                  {activeTab === 'search' && 'Pencarian Dokumen'}
                  {activeTab === 'loans' && 'Peminjaman Arsip'}
                  {activeTab === 'vault' && 'Vault Rahasia'}
                  {activeTab === 'labels' && 'Cetak Label Arsip'}
                  {activeTab === 'scanner' && 'Scan QR Kontrol'}
                  {activeTab === 'archive-codes' && 'Daftar Kode Klasifikasi'}
                  {activeTab === 'reports' && 'Laporan & Statistik'}
                  {activeTab === 'units' && 'Manajemen Unit DJKI'}
                  {activeTab === 'users' && 'Manajemen Pengguna'}
                  {activeTab === 'settings' && 'Pengaturan Jurnal & Sistem'}
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sistem Manajemen Arsip Digital DJKI • v2.1.0</p>
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-slate-800 leading-tight">{currentUser?.name || 'Administrator'}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{currentUser?.role || 'SUPERADMIN'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-blue-500/10 shadow-sm shrink-0 bg-slate-50">
                    <img src={currentUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="User" className="w-full h-full object-cover" />
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-[11px] font-black hover:bg-red-600 hover:text-white transition-all border border-red-100 uppercase tracking-widest"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Arsip" value={documents.length} icon={ArchiveIcon} color="bg-blue-600" />
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

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: List of Settings Sections */}
                <div className="lg:col-span-2 space-y-6">
                  {/* General settings */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Identitas Aplikasi & Instansi
                      </h3>
                    </div>
                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Aplikasi</label>
                          <input 
                            type="text" 
                            value={webSettings.siteName}
                            onChange={(e) => setWebSettings({...webSettings, siteName: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Instansi / Departemen</label>
                          <input 
                            type="text" 
                            value={webSettings.department}
                            onChange={(e) => setWebSettings({...webSettings, department: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      </div>

                      {/* Logo Settings */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Logo Aplikasi & Sidebar</label>
                        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <motion.div 
                            whileTap={{ scale: 0.95 }}
                            className="shine-effect w-24 h-24 bg-white rounded-2xl border-2 border-slate-200 flex items-center justify-center overflow-hidden p-3 shadow-sm cursor-pointer"
                          >
                            <img 
                              src={webSettings.logoUrl} 
                              alt="Preview Logo" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/identicon/svg?seed=DJKI';
                              }}
                              className="max-w-full max-h-full object-contain relative z-10" 
                            />
                          </motion.div>
                          <div className="flex-1 space-y-3">
                            <p className="text-[10px] text-slate-500 font-bold leading-tight">Unggah logo resmi instansi Anda. File PNG transparan sangat disarankan untuk tampilan terbaik.</p>
                            <div className="flex gap-2">
                              <input 
                                type="file" 
                                id="logo-setting-upload" 
                                hidden 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      setWebSettings({...webSettings, logoUrl: ev.target?.result as string});
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <label 
                                htmlFor="logo-setting-upload"
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] cursor-pointer hover:bg-blue-700 transition-all flex items-center gap-2"
                              >
                                <Camera className="w-3 h-3" /> Ganti Logo
                              </label>
                              <button 
                                onClick={() => setWebSettings({...webSettings, logoUrl: 'https://lh3.googleusercontent.com/d/1he5AoYAHMd9dlg47zLlR_-vSX_tQ9u95'})}
                                className="px-4 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl font-black text-[10px] hover:bg-slate-50 transition-all"
                              >
                                Reset Default
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                        <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-800 leading-tight">Perubahan Identitas</p>
                          <p className="text-[10px] text-blue-600 mt-1">Nama ini akan muncul pada seluruh header laporan, meta-data export, dan identitas browser.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Settings */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" />
                        Konfigurasi Sistem & Database
                      </h3>
                    </div>
                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div>
                            <p className="text-sm font-black text-slate-800">Modus Pemeliharaan</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Nonaktifkan akses publik</p>
                          </div>
                          <button 
                            onClick={() => setWebSettings({...webSettings, maintenanceMode: !webSettings.maintenanceMode})}
                            className={`w-12 h-6 rounded-full transition-all relative ${webSettings.maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${webSettings.maintenanceMode ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div>
                            <p className="text-sm font-black text-slate-800">Teknologi OCR AI</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Ekstraksi teks otomatis</p>
                          </div>
                          <button 
                            onClick={() => setWebSettings({...webSettings, ocrEnabled: !webSettings.ocrEnabled})}
                            className={`w-12 h-6 rounded-full transition-all relative ${webSettings.ocrEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${webSettings.ocrEnabled ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div>
                            <p className="text-sm font-black text-slate-800">Backup Otomatis</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Cadangkan data harian</p>
                          </div>
                          <button 
                            onClick={() => setWebSettings({...webSettings, autoBackup: !webSettings.autoBackup})}
                            className={`w-12 h-6 rounded-full transition-all relative ${webSettings.autoBackup ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${webSettings.autoBackup ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Timeout Sesi</label>
                          <select 
                            value={webSettings.sessionTimeout}
                            onChange={(e) => setWebSettings({...webSettings, sessionTimeout: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          >
                            <option value="15 Menit">15 Menit</option>
                            <option value="30 Menit">30 Menit</option>
                            <option value="60 Menit">60 Menit</option>
                            <option value="Selamanya">Selamanya</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button 
                          onClick={handleSaveSettings}
                          className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" /> Simpan Perubahan Pengaturan
                        </button>
                        <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4" /> Re-index OCR Database
                        </button>
                        <button className="flex-1 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                          <Trash2 className="w-4 h-4" /> Reset Semua Data (Caution!)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Google Sheets Sync System */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        Sinkronisasi Google Sheets
                      </h3>
                    </div>
                    <div className="p-8 space-y-6">
                      <p className="text-xs text-slate-500 font-bold leading-relaxed">
                        Hubungkan portal arsip digital Anda dengan Google Sheets untuk sinkronisasi, pencadangan otomatis cloud, dan kemudahan ekspor laporan dalam satu spreadsheet spreadsheet real-time di Google Drive.
                      </p>

                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Status Koneksi Google</p>
                          {googleSheetsToken ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <p className="text-sm font-black text-slate-700">Terhubung ({googleSheetsUserEmail || webSettings.googleSheetsConnectedEmail})</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                              <p className="text-sm font-black text-slate-600">Belum Terhubung</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={handleConnectGoogleSheets}
                            className={`px-5 py-3 rounded-xl font-black text-xs transition-all flex items-center gap-2.5 ${
                              googleSheetsToken 
                                ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' 
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M21.35 11.1H12v3.8h5.38c-.23 1.16-.9 2.13-1.88 2.8l2.92 2.27c1.71-1.58 2.68-3.9 2.68-6.67 0-.75-.07-1.48-.2-2.2z" fill="#4285F4"/>
                              <path d="M12 21c2.43 0 4.47-.8 5.96-2.2l-2.92-2.27c-.8.54-1.84.87-3.04.87-2.34 0-4.33-1.58-5.04-3.7l-3.03 2.34C5.4 19.34 8.44 21 12 21z" fill="#34A853"/>
                              <path d="M6.96 13.7c-.18-.54-.28-1.12-.28-1.7s.1-1.16.28-1.7l-3.03-2.34C3.33 9.3 3 10.61 3 12c0 1.39.33 2.7 1.05 3.9l3.03-2.34z" fill="#FBBC05"/>
                              <path d="M12 6.7c1.32 0 2.5.45 3.44 1.35l2.58-2.58C16.46 3.9 14.43 3 12 3 8.44 3 5.4 4.66 3.93 7.96l3.03 2.34c.71-2.12 2.7-3.7 5.04-3.7z" fill="#EA4335"/>
                            </svg>
                            {googleSheetsToken ? 'Ganti / Hubungkan Ulang' : 'Hubungkan Akun Google'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Spreadsheet ID</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Masukkan ID Spreadsheet..."
                              value={webSettings.googleSheetsSpreadsheetId || ''}
                              onChange={(e) => setWebSettings({...webSettings, googleSheetsSpreadsheetId: e.target.value})}
                              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs"
                            />
                            {googleSheetsToken && (
                              <button
                                onClick={handleCreateNewSheet}
                                disabled={isSyncingSheets}
                                className="px-4 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 rounded-2xl font-black text-xs transition-all whitespace-nowrap opacity-100 cursor-pointer"
                              >
                                Buat Baru
                              </button>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold pl-1">ID berkas yang ada di URL spreadsheet Anda (misal: d/&lt;id-berkas&gt;/edit)</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sinkronisasi Otomatis</label>
                          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                            <div>
                              <p className="text-xs font-black text-slate-700">Auto Sync</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Cadangkan otomatis ke sheets</p>
                            </div>
                            <button 
                              onClick={() => setWebSettings({...webSettings, googleSheetsAutoSync: !webSettings.googleSheetsAutoSync})}
                              className={`w-10 h-5.5 rounded-full transition-all relative ${webSettings.googleSheetsAutoSync ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                              <div className={`absolute top-0.75 w-4 h-4 bg-white rounded-full transition-all ${webSettings.googleSheetsAutoSync ? 'left-5.25' : 'left-0.75'}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {webSettings.googleSheetsSpreadsheetId && (
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 flex items-start gap-4">
                          <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-emerald-800 leading-tight">Spreadsheet Terhubung</p>
                            <a 
                              href={`https://docs.google.com/spreadsheets/d/${webSettings.googleSheetsSpreadsheetId}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center mt-1.5 gap-1"
                            >
                              Buka Spreadsheet di Google Sheets ↗
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button
                          onClick={handleSyncToSheets}
                          disabled={isSyncingSheets || !googleSheetsToken || !webSettings.googleSheetsSpreadsheetId}
                          className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          {isSyncingSheets ? 'Memproses Sinkronisasi...' : 'Sinkronisasikan Semua Arsip Sekarang'}
                        </button>
                      </div>

                      {lastSyncedTime && (
                        <p className="text-[9px] text-slate-400 font-black text-right">Terakhir sinkronisasi: {lastSyncedTime}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Information & Visual */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
                    <h4 className="font-black text-xl mb-4 leading-tight">Informasi Versi & Lisensi</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-xs font-bold opacity-60">Versi Sistem</span>
                        <span className="text-xs font-black">v2.4.0-Enterprise</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-xs font-bold opacity-60">Engine OCR</span>
                        <span className="text-xs font-black">Gemini 1.5 Flash</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-xs font-bold opacity-60">Status Lisensi</span>
                        <span className="text-[10px] bg-emerald-500 px-2 py-0.5 rounded-full font-black">ACTIVE</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs font-bold opacity-60">Terakhir Update</span>
                        <span className="text-xs font-black">18 Mei 2026</span>
                      </div>
                    </div>
                    <button className="w-full mt-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl font-black text-xs transition-all border border-white/20">
                      Cek Pembaruan Sistem
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                    <h4 className="font-black text-slate-800 mb-6">Tema & Visual</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <button className="p-4 rounded-2xl border-2 border-blue-500 bg-blue-50 text-blue-600 text-center">
                        <LayoutDashboard className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase">Standard</p>
                      </button>
                      <button className="p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-300 transition-all text-slate-400 text-center">
                        <div className="w-6 h-6 bg-slate-900 rounded mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase">Dark Mode</p>
                      </button>
                      <button className="p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-300 transition-all text-slate-400 text-center col-span-2">
                        <p className="text-[10px] font-black uppercase">Warna Aksen: Biru DJKI</p>
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl">
                    <div className="flex gap-3 mb-2">
                       <ShieldCheck className="w-5 h-5 text-amber-600" />
                       <h5 className="font-black text-amber-800 text-xs">Keamanan Administrator</h5>
                    </div>
                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">Anda sedang mengakses pengaturan sistem sebagai Super Admin. Segala perubahan akan dicatat dalam audit log.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detail View (Shared) */}
          {selectedDocForDetail && (activeTab === 'archive-list' || activeTab === 'search') && (
            <ArchiveDetail 
              archive={selectedDocForDetail} 
              onClose={() => setSelectedDocForDetail(null)}
              canEdit={canEdit}
              currentUser={currentUser}
              onEdit={(archive) => {
                setSelectedDocForEdit(archive);
                setShowForm(true);
              }}
            />
          )}

          {/* Archive List Tab */}
          {activeTab === 'archive-list' && !selectedDocForDetail && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Inventaris Arsip</h3>
                    <p className="text-slate-500 text-sm">Kelola dan pantau seluruh berkas fisik yang tersimpan.</p>
                  </div>
                  <div className="flex gap-2">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setSelectedDocForEdit(null);
                          setShowForm(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 shadow-sm shadow-blue-100 transition-all flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" /> Tambah Arsip
                      </button>
                    )}
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 shadow-sm shadow-emerald-100 transition-all flex items-center gap-2"
                    >
                      <Download className="w-3 h-3" /> Export Excel
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6 pt-4 border-t border-slate-100">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Cari cepat (Nama, No Berkas)..."
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
                    value={filterUnit}
                    onChange={(e) => setFilterUnit(e.target.value)}
                    disabled={!!currentUser?.processingUnit && (currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERATOR')}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none max-w-[150px] disabled:opacity-60"
                  >
                    <option value="Semua">Semua Unit</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <ArchiveTable 
                  data={filteredDocs} 
                  onDetail={setSelectedDocForDetail}
                  onEdit={(doc) => {
                    setSelectedDocForEdit(doc);
                    setShowForm(true);
                  }}
                  onDelete={deleteArchive}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && !selectedDocForDetail && (
            <div className="space-y-8">
              <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Pencarian Arsip Terpadu</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">Cari informasi di seluruh metadata arsip, termasuk konten di dalam dokumen melalui teknologi OCR AI.</p>
                
                <div className="max-w-3xl mx-auto relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 w-6 h-6" />
                  <input 
                    type="text" 
                    placeholder="Masukkan kata kunci, nomor berkas, nama pemohon, atau isi dokumen..." 
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Pencarian Metadata
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Pencarian Teks Digital (OCR)
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div> Lokasi Fisik Arsip
                  </div>
                </div>
              </div>

              {searchQuery && (
                <div className="bg-white rounded-2xl shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-800">
                      Hasil Pencarian 
                      <span className="ml-2 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] rounded uppercase font-black">
                        {filteredDocs.length} Ditemukan
                      </span>
                    </h3>
                  </div>
                  
                  {filteredDocs.length > 0 ? (
                    <ArchiveTable 
                      data={filteredDocs} 
                      onDetail={setSelectedDocForDetail}
                      onEdit={(doc) => {
                        setSelectedDocForEdit(doc);
                        setShowForm(true);
                      }}
                      onDelete={deleteArchive}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  ) : (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500 font-bold">Tidak ada arsip yang cocok dengan kata kunci "{searchQuery}"</p>
                      <p className="text-slate-400 text-xs mt-1">Coba gunakan kata kunci yang lebih umum.</p>
                    </div>
                  )}
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
                {canEdit && (
                  <button
                    onClick={() => setShowLoanForm(true)}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Plus className="w-5 h-5" /> Buat Peminjaman Baru
                  </button>
                )}
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
                                   <ArchiveIcon className="w-5 h-5" />
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
                  {canEdit && (
                    <button onClick={() => { setSelectedUnitForEdit(null); setShowUnitForm(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200">
                      + Unit Baru
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {units.map((unit) => (
                    <div key={unit} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:border-blue-200 transition-all group relative">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {canEdit && (
                          <>
                            <button onClick={() => { setSelectedUnitForEdit(unit); setShowUnitForm(true); }} className="p-1.5 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteUnit(unit)} className="p-1.5 bg-white text-red-600 rounded-lg shadow-sm border border-slate-100 hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight pr-12">{unit}</h4>
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
                {canEdit && (
                  <button onClick={() => { setSelectedCategoryForEdit(null); setShowCategoryForm(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:bg-blue-700">+ Kategori Baru</button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map(cat => (
                  <div key={cat} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-all pointer-events-none" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {canEdit && (
                        <>
                          <button onClick={() => { setSelectedCategoryForEdit(cat); setShowCategoryForm(true); }} className="p-1 bg-white text-blue-600 rounded border border-slate-200 hover:bg-blue-600 hover:text-white"><Edit className="w-3 h-3" /></button>
                          <button onClick={() => deleteCategory(cat)} className="p-1 bg-white text-red-600 rounded border border-slate-200 hover:bg-red-600 hover:text-white"><Trash2 className="w-3 h-3" /></button>
                        </>
                      )}
                    </div>
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
                {canEdit && (
                  <button onClick={() => { setSelectedClassificationForEdit(null); setShowClassificationForm(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">+ Klasifikasi Baru</button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {classifications.map(cls => (
                  <div key={cls} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group relative">
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {canEdit && (
                        <>
                          <button onClick={() => { setSelectedClassificationForEdit(cls); setShowClassificationForm(true); }} className="p-1 px-2 bg-white text-blue-600 rounded border border-slate-200 hover:bg-blue-600 hover:text-white text-[10px] font-bold">Edit</button>
                          <button onClick={() => deleteClassification(cls)} className="p-1 px-2 bg-white text-red-600 rounded border border-slate-200 hover:bg-red-600 hover:text-white text-[10px] font-bold">Hapus</button>
                        </>
                      )}
                    </div>
                    <ShieldCheck className="w-8 h-8 text-blue-600 mb-3" />
                    <p className="font-black text-slate-800">{cls}</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Pengaturan akses level {cls}</p>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${cls === 'Rahasia' ? 'bg-red-500' : cls === 'Terbatas' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${(documents.filter(d => d.securityClassification === cls).length / (documents.length || 1)) * 100}%` }}
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
                {['SUPERADMIN', 'ADMIN', 'OPERATOR', 'VIEWER'].map(role => (
                  <div key={role} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">{role}</p>
                      <p className="text-xs text-slate-500">Izin akses untuk peran personil {role}</p>
                    </div>
                    {canManageUsers && (
                      <button 
                        onClick={() => {
                          setSelectedRoleForPerms(role as Role);
                          setShowPermsModal(true);
                        }}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all"
                      >
                        Atur Izin
                      </button>
                    )}
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
                {canManageUsers && (
                  <button onClick={() => { setSelectedUserForEdit(null); setShowUserForm(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition-all hover:bg-blue-700">+ User Baru</button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Unit</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Password</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => currentUser?.role === 'SUPERADMIN' || u.processingUnit === currentUser?.processingUnit).map(u => (
                      <tr key={u.id} className="border-b hover:bg-slate-50 group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar} alt="" className="w-8 h-8 rounded-lg shadow-sm border border-slate-100" />
                            <div>
                              <p className="text-sm font-bold text-slate-800">{u.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold tracking-tight">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-[9px] font-black rounded uppercase tracking-wider ${
                            u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 
                            u.role === 'OPERATOR' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-600 tabular-nums">{u.processingUnit || 'Semua Unit'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                              {visiblePasswords.has(u.id) ? (u.password || '••••••••') : '••••••••'}
                            </span>
                            <button 
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="text-slate-400 hover:text-blue-500 transition-colors"
                              title={visiblePasswords.has(u.id) ? "Sembunyikan Password" : "Lihat Password"}
                            >
                              {visiblePasswords.has(u.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {canManageUsers && (
                              <>
                                <button onClick={() => { setSelectedUserForPass(u); setShowChangePassForm(true); }} className="p-1.5 bg-white text-slate-600 rounded-lg shadow-sm border border-slate-100 hover:bg-slate-900 hover:text-white transition-all" title="Ganti Password"><Key className="w-3.5 h-3.5" /></button>
                                <button onClick={() => { setSelectedUserForEdit(u); setShowUserForm(true); }} className="p-1.5 bg-white text-blue-600 rounded-lg shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteUser(u.id)} className="p-1.5 bg-white text-red-600 rounded-lg shadow-sm border border-slate-100 hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                              </>
                            )}
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
        </div>

        {/* Footer - Fixed */}
        <footer className="shrink-0 bg-white border-t border-slate-200 p-4 lg:px-8 z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase text-center md:text-left">
                © {new Date().getFullYear()} {webSettings.siteName} • DIREKTORAT JENDERAL KEKAYAAN INTELEKTUAL
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-[10px] text-slate-400 hover:text-blue-600 font-black uppercase tracking-widest transition-colors">Panduan Sistem</a>
              <div className="h-3 w-[1px] bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest leading-none">Developed by</span>
                <span className="text-[10px] text-blue-600 font-black tracking-widest leading-none">CAQIESTUDIOPRODUCTION</span>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Archive Form Modal */}
      {showForm && (
        <ArchiveForm
          archive={selectedDocForEdit}
          units={units}
          categories={categories}
          classifications={classifications}
          currentUser={currentUser}
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
          units={units}
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

      {/* Management Modals */}
      {showUnitForm && (
        <ManagementModal
          title={selectedUnitForEdit ? 'Edit Unit Kerja' : 'Tambah Unit Kerja'}
          placeholder="Nama Unit Kerja (e.g. Subdit Kepegawaian)"
          initialValue={selectedUnitForEdit}
          onClose={() => { setShowUnitForm(false); setSelectedUnitForEdit(null); }}
          onSave={saveUnit}
        />
      )}

      {showCategoryForm && (
        <ManagementModal
          title={selectedCategoryForEdit ? 'Edit Kategori' : 'Tambah Kategori'}
          placeholder="Nama Kategori (e.g. Aktif)"
          initialValue={selectedCategoryForEdit}
          onClose={() => { setShowCategoryForm(false); setSelectedCategoryForEdit(null); }}
          onSave={saveCategory}
        />
      )}

      {showClassificationForm && (
        <ManagementModal
          title={selectedClassificationForEdit ? 'Edit Klasifikasi' : 'Tambah Klasifikasi'}
          placeholder="Nama Klasifikasi (e.g. Rahasia)"
          initialValue={selectedClassificationForEdit}
          onClose={() => { setShowClassificationForm(false); setSelectedClassificationForEdit(null); }}
          onSave={saveClassification}
        />
      )}

      {showUserForm && (
        <UserFormModal
          user={selectedUserForEdit}
          units={units}
          roles={rolePermissions}
          currentUser={currentUser}
          onClose={() => { setShowUserForm(false); setSelectedUserForEdit(null); }}
          onSave={saveUser}
        />
      )}
      
      {showChangePassForm && selectedUserForPass && (
        <ChangePasswordModal
          user={selectedUserForPass}
          onSave={changeUserPassword}
          onClose={() => { setShowChangePassForm(false); setSelectedUserForPass(null); }}
        />
      )}

      {/* Permission Modal */}
      {showPermsModal && selectedRoleForPerms && (
        <PermissionModal
          role={selectedRoleForPerms}
          permissions={rolePermissions}
          onClose={() => setShowPermsModal(false)}
          onSave={savePermissions}
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