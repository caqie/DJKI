import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
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
};

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
    uploadDate: '2023-11-12T08:00:00Z'
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
          <h1 className="text-2xl font-black text-slate-800">DJKI Vault</h1>
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
    { id: 'loans', label: 'Peminjaman', icon: Clock },
    { id: 'vault', label: 'Vault Rahasia', icon: Lock },
    { id: 'labels', label: 'Cetak Label', icon: Printer },
    { id: 'scanner', label: 'Scan QR', icon: ScanLine },
    { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'units', label: 'Unit Kerja', icon: Building2 },
    { id: 'categories', label: 'Kategori Arsip', icon: FolderOpen },
    { id: 'classifications', label: 'Klasifikasi', icon: ShieldCheck },
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
                <h1 className="font-black text-lg truncate">DJKI Vault</h1>
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
                <InputField name="classificationCode" label="Kode Klasifikasi" value={data.classificationCode} onChange={handleChange} placeholder="HK.01.01" />
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
                Unit & Tambahan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField name="processingUnit" label="Unit Pengolah" value={data.processingUnit} onChange={handleChange} options={DJKI_UNITS} />
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
  const [boxes, setBoxes] = useState<ArchiveBox[]>([]);
  const [selectedBox, setSelectedBox] = useState<ArchiveBox | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterLocation, setFilterLocation] = useState('Semua');
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<Archive | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
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
        doc.fileNumber.toLowerCase().includes(searchStr);
      
      const matchesCategory = filterCategory === 'Semua' || doc.archiveCategory === filterCategory;
      const matchesLocation = filterLocation === 'Semua' || doc.building === filterLocation;
      
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [documents, searchQuery, filterCategory, filterLocation, currentUser]);

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
  const createLoan = (archiveId: string, borrowerName: string, borrowerNip: string) => {
    const loan: LoanRecord = {
      id: crypto.randomUUID(),
      archiveId,
      borrowerName,
      borrowerNip,
      loanDate: new Date().toISOString(),
      status: 'Dipinjam',
      notes: ''
    };
    setLoans([...loans, loan]);
  };

  const returnLoan = (loanId: string) => {
    setLoans(loans.map(l => 
      l.id === loanId 
        ? { ...l, status: 'Dikembalikan', returnDate: new Date().toISOString() }
        : l
    ));
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
                <StatCard title="Sedang Dipinjam" value={loans.filter(l => l.status === 'Dipinjam').length} icon={Clock} color="bg-amber-600" />
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

          {/* Archive List / Detail */}
          {activeTab === 'archive-list' && (
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
                        placeholder="Cari metadata arsip..."
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
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4">Tracking Peminjaman Arsip</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Peminjam</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Tanggal Pinjam</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan) => (
                      <tr key={loan.id} className="border-b">
                        <td className="px-4 py-3 text-sm">{loan.borrowerName}</td>
                        <td className="px-4 py-3 text-sm">{new Date(loan.loanDate).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            loan.status === 'Dipinjam' ? 'bg-amber-100 text-amber-700' :
                            loan.status === 'Dikembalikan' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {loan.status === 'Dipinjam' && (
                            <button
                              onClick={() => returnLoan(loan.id)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                            >
                              Kembalikan
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {loans.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                          Belum ada peminjaman
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4">Cetak Label Box Arsip</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <select
                    value={selectedBox?.id || ''}
                    onChange={(e) => {
                      const box = boxes.find(b => b.id === e.target.value);
                      setSelectedBox(box || null);
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-4"
                  >
                    <option value="">Pilih Box</option>
                    {boxes.map((box) => (
                      <option key={box.id} value={box.id}>{box.boxNumber}</option>
                    ))}
                  </select>
                  {selectedBox && (
                    <button
                      onClick={printLabel}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                    >
                      Print Label
                    </button>
                  )}
                </div>
                {selectedBox && (
                  <div className="border-2 border-slate-900 p-4 w-full max-w-[300px]">
                    <div className="flex items-center gap-3 mb-3">
                      <QRCodeSVG
                        value={JSON.stringify({
                          boxId: selectedBox.id,
                          boxNumber: selectedBox.boxNumber,
                          location: selectedBox.location
                        })}
                        size={80}
                      />
                      <div>
                        <p className="font-bold text-lg">{selectedBox.boxNumber}</p>
                        <p className="text-xs text-slate-600">{selectedBox.location}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{selectedBox.processingUnit}</p>
                  </div>
                )}
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