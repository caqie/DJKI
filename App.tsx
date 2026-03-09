import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { 
  Download, Printer, FileText, Search, Filter, Plus, Eye, Edit, Trash2, 
  Lock, Key, LogOut, User as UserIcon, ShieldCheck, Database, LayoutDashboard,
  QrCode, ScanLine, Archive
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import DocumentCard from './components/DocumentCard';
import StatsOverview from './components/StatsOverview';
import VaultLogin from './components/VaultLogin';
import { IntellectualPropertyDoc, ArchiveBox, User, Role } from './types';

const DJKI_UNITS = [
  'Sekretariat Direktorat Jenderal',
  'Direktorat Hak Cipta dan Desain Industri',
  'Direktorat Paten, DTLST, dan Rahasia Dagang',
  'Direktorat Merek dan Indikasi Geografis',
  'Direktorat Kerja Sama dan Pemberdayaan KI',
  'Direktorat Teknologi Informasi KI',
  'Direktorat Penyidikan dan Penyelesaian Sengketa'
];

const INITIAL_DOCS: IntellectualPropertyDoc[] = [
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
    developmentLevel: 'Asli',
    securityClassification: 'Terbuka',
    building: 'Gedung A',
    floor: '1',
    cabinet: 'C-01',
    shelf: 'S-01',
    mapOrFolder: 'MAP-01',
    archiveYear: '2023',
    processingUnit: 'Direktorat Merek dan Indikasi Geografis',
    retentionPeriod: '10 Tahun',
    uploadedBy: 'admin-merek'
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
    developmentLevel: 'Draft',
    securityClassification: 'Terbatas',
    building: 'Gedung A',
    floor: '1',
    cabinet: 'C-01',
    shelf: 'S-01',
    mapOrFolder: 'MAP-02',
    archiveYear: '2024',
    processingUnit: 'Direktorat Paten, DTLST, dan Rahasia Dagang',
    retentionPeriod: '20 Tahun',
    uploadedBy: 'admin-paten'
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
    developmentLevel: 'Asli',
    securityClassification: 'Rahasia',
    building: 'Gedung B',
    floor: '2',
    cabinet: 'C-05',
    shelf: 'S-02',
    mapOrFolder: 'MAP-10',
    archiveYear: '2024',
    processingUnit: 'Sekretariat Direktorat Jenderal',
    retentionPeriod: 'Permanen',
    uploadedBy: 'superadmin'
  }
];

const INITIAL_BOXES: ArchiveBox[] = [
  {
    id: 'box-1',
    boxNumber: 'BOX-2024-001',
    location: 'Gudang A, Rak 1, Baris B',
    documentIds: ['1', '2'],
    processingUnit: 'Direktorat Merek dan Indikasi Geografis',
    yearRange: '2023 - 2024',
    createdAt: '2024-02-01'
  },
  {
    id: 'box-2',
    boxNumber: 'BOX-2024-002',
    location: 'Gudang A, Rak 2, Baris A',
    documentIds: ['3'],
    processingUnit: 'Sekretariat Direktorat Jenderal',
    yearRange: '2024',
    createdAt: '2024-02-15'
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState<IntellectualPropertyDoc[]>(INITIAL_DOCS);
  const [boxes, setBoxes] = useState<ArchiveBox[]>(INITIAL_BOXES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [scannedBoxData, setScannedBoxData] = useState<{
    boxId: string;
    boxNumber: string;
    titles: string[];
    location?: string;
  } | null>(null);

  const [selectedDocForView, setSelectedDocForView] = useState<IntellectualPropertyDoc | null>(null);
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<IntellectualPropertyDoc | null>(null);
  const [selectedBox, setSelectedBox] = useState<ArchiveBox | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('djki_scan_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('djki_scan_history', JSON.stringify(scanHistory));
  }, [scanHistory]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // RBAC Filtering
      const isAuthorized = 
        currentUser?.role === 'SUPERADMIN' || 
        doc.processingUnit === currentUser?.processingUnit;

      if (!isAuthorized) return false;

      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = 
        doc.archiveDescription.toLowerCase().includes(searchStr) || 
        doc.documentNumber.toLowerCase().includes(searchStr) ||
        doc.name.toLowerCase().includes(searchStr) ||
        doc.nipOrApplicant.toLowerCase().includes(searchStr) ||
        doc.processingUnit.toLowerCase().includes(searchStr) ||
        doc.fileNumber.toLowerCase().includes(searchStr) ||
        doc.archiveYear.toLowerCase().includes(searchStr);
        
      const matchesCategory = filterCategory === 'Semua' || doc.archiveType === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, filterCategory, currentUser]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(documents.map(doc => ({
      'Nomor Berkas': doc.fileNumber,
      'Nomor Item': doc.archiveItemNumber,
      'No Box': doc.boxNumber,
      'Kategori': doc.archiveCategory,
      'Klasifikasi': doc.classificationCode,
      'Bentuk': doc.documentForm,
      'Nama': doc.name,
      'NIP/Pemohon': doc.nipOrApplicant,
      'Jenis Arsip': doc.archiveType,
      'Keterangan': doc.archiveDescription,
      'No Dokumen': doc.documentNumber,
      'Tahun': doc.archiveYear,
      'Unit Pengolah': doc.processingUnit,
      'Lokasi': `${doc.building}, L${doc.floor}, C${doc.cabinet}`
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Arsip");
    XLSX.writeFile(workbook, `Daftar_Arsip_DJKI_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDoc, setNewDoc] = useState<Partial<IntellectualPropertyDoc>>({
    fileNumber: '',
    archiveItemNumber: '',
    boxNumber: '',
    archiveCategory: 'Aktif',
    classificationCode: '',
    documentForm: 'Asli',
    name: '',
    nipOrApplicant: '',
    archiveType: '',
    archiveDescription: '',
    documentNumber: '',
    documentDate: new Date().toISOString().split('T')[0],
    developmentLevel: 'Asli',
    securityClassification: 'Terbuka',
    building: '',
    floor: '',
    cabinet: '',
    shelf: '',
    mapOrFolder: '',
    archiveYear: new Date().getFullYear().toString(),
    processingUnit: '',
    retentionPeriod: '',
    additionalNotes: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadSuccess(false);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const doc: IntellectualPropertyDoc = {
        id: Date.now().toString(),
        fileNumber: newDoc.fileNumber || '',
        archiveItemNumber: newDoc.archiveItemNumber || '',
        boxNumber: newDoc.boxNumber || '',
        archiveCategory: newDoc.archiveCategory as any || 'Aktif',
        classificationCode: newDoc.classificationCode || '',
        documentForm: newDoc.documentForm as any || 'Asli',
        name: newDoc.name || '',
        nipOrApplicant: newDoc.nipOrApplicant || '',
        archiveType: newDoc.archiveType || '',
        archiveDescription: newDoc.archiveDescription || '',
        documentNumber: newDoc.documentNumber || ('DOC-' + Math.floor(10000000 + Math.random() * 90000000)),
        documentDate: newDoc.documentDate || new Date().toISOString().split('T')[0],
        developmentLevel: newDoc.developmentLevel as any || 'Asli',
        securityClassification: newDoc.securityClassification as any || 'Terbuka',
        building: newDoc.building || '',
        floor: newDoc.floor || '',
        cabinet: newDoc.cabinet || '',
        shelf: newDoc.shelf || '',
        mapOrFolder: newDoc.mapOrFolder || '',
        archiveYear: newDoc.archiveYear || new Date().getFullYear().toString(),
        processingUnit: newDoc.processingUnit || '',
        retentionPeriod: newDoc.retentionPeriod || '',
        additionalNotes: newDoc.additionalNotes || '',
        uploadedBy: currentUser?.id || 'system'
      };

      setDocuments(prev => [doc, ...prev]);
      setUploadSuccess(true);
      
      setTimeout(() => {
        setActiveTab('search');
        setNewDoc({ 
          fileNumber: '',
          archiveItemNumber: '',
          boxNumber: '',
          archiveCategory: 'Aktif',
          classificationCode: '',
          documentForm: 'Asli',
          name: '',
          nipOrApplicant: '',
          archiveType: '',
          archiveDescription: '',
          documentNumber: '',
          documentDate: new Date().toISOString().split('T')[0],
          developmentLevel: 'Asli',
          securityClassification: 'Terbuka',
          building: '',
          floor: '',
          cabinet: '',
          shelf: '',
          mapOrFolder: '',
          archiveYear: new Date().getFullYear().toString(),
          processingUnit: '',
          retentionPeriod: '',
          additionalNotes: ''
        });
        setSelectedFile(null);
        setUploadSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (activeTab === 'scanner') {
      // Small delay to ensure the DOM element #reader is rendered
      const timer = setTimeout(() => {
        const readerElement = document.getElementById('reader');
        if (!readerElement) return;

        scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scanner.render((decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.boxId) {
              const box = boxes.find(b => b.id === data.boxId);
              
              // RBAC Check for Scanned Box
              const isAuthorized = 
                currentUser?.role === 'SUPERADMIN' || 
                box?.processingUnit === currentUser?.processingUnit;

              if (!isAuthorized) {
                alert('Akses Ditolak: Anda tidak memiliki izin untuk melihat isi box dari unit pengolah lain.');
                return;
              }

              const scanResult = {
                boxId: data.boxId,
                boxNumber: data.boxNumber || 'Unknown',
                titles: data.titles || [],
                location: box?.location,
                timestamp: new Date().toISOString()
              };
              setScannedBoxData(scanResult);
              
              // Add to history if not already the latest
              setScanHistory(prev => {
                const exists = prev.find(h => h.boxId === data.boxId && h.timestamp.split('T')[0] === scanResult.timestamp.split('T')[0]);
                if (exists) return prev;
                return [scanResult, ...prev].slice(0, 10);
              });
            } else if (data.num) {
              setSearchQuery(data.num);
              setActiveTab('search');
              scanner?.clear();
            }
          } catch (e) {
            console.error("Invalid QR Code", e);
          }
        }, (error) => {
          // console.warn(error);
        });
      }, 300); // 300ms delay to account for animations

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        }
      };
    }
  }, [activeTab, boxes, currentUser]);

  const handleDeleteDoc = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus arsip ini?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  const handleUpdateDoc = (updatedDoc: IntellectualPropertyDoc) => {
    setDocuments(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
    setSelectedDocForEdit(null);
  };

  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Hapus pengguna ini?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  if (!isLoggedIn) {
    return <VaultLogin onLogin={(user) => {
      setCurrentUser(user);
      setIsLoggedIn(true);
    }} />;
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        user={currentUser}
        onLogout={() => {
          setIsLoggedIn(false);
          setCurrentUser(null);
        }}
      />
      
      <main className="flex-1 lg:ml-64 p-4 md:p-10 transition-all duration-300">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              ☰
            </button>
            <div className="hidden lg:flex w-14 h-14 bg-white p-3 rounded-2xl shadow-xl shadow-blue-500/5 items-center justify-center border border-slate-100">
              <img 
                src="https://lh3.googleusercontent.com/d/1he5AoYAHMd9dlg47zLlR_-vSX_tQ9u95" 
                alt="DJKI Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight capitalize">
                {activeTab === 'dashboard' && 'Dashboard Analitik'}
                {activeTab === 'archive-list' && 'Daftar Arsip'}
                {activeTab === 'search' && 'Pencarian Berkas'}
                {activeTab === 'upload' && 'Arsip Baru'}
                {activeTab === 'labels' && 'Cetak Label Arsip'}
                {activeTab === 'scanner' && 'Scan Label Box'}
                {activeTab === 'categories' && 'Manajemen Kategori'}
                {activeTab === 'reports' && 'Laporan & Analitik'}
                {activeTab === 'settings' && 'Pengaturan Sistem'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">Sistem Manajemen Arsip Digital DJKI Vault.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-end">
             <div className="relative hidden sm:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Cari nomor berkas..." 
                  className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 w-48 md:w-72 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <button className="bg-white border border-slate-200 text-slate-600 p-3.5 rounded-2xl hover:bg-slate-50 transition-all relative shadow-sm">
                <span className="text-lg">🔔</span>
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-900 leading-none">{currentUser?.name}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{currentUser?.role}</p>
                </div>
                <img src={currentUser?.avatar} alt="User" className="w-11 h-11 rounded-2xl bg-white p-0.5 border border-slate-200 shadow-sm" />
             </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Berkas', value: filteredDocs.length, color: 'blue', icon: '📁' },
                    { label: 'Arsip Terbuka', value: filteredDocs.filter(d => d.securityClassification === 'Terbuka').length, color: 'emerald', icon: '🔓' },
                    { label: 'Arsip Terbatas', value: filteredDocs.filter(d => d.securityClassification === 'Terbatas').length, color: 'amber', icon: '🔒' },
                    { label: 'Arsip Rahasia', value: filteredDocs.filter(d => d.securityClassification === 'Rahasia').length, color: 'red', icon: '🕵️' },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${
                        stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        stat.color === 'red' ? 'bg-red-100 text-red-600' :
                        stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {stat.icon}
                      </div>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                    </div>
                  ))}
                </div>
                
                <StatsOverview docs={filteredDocs} />

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800">Dokumen Terbaru</h3>
                    <button 
                      onClick={() => setActiveTab('archive-list')}
                      className="text-blue-600 text-sm font-bold hover:underline"
                    >
                      Lihat Semua →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocs.slice(0, 3).map(doc => (
                      <DocumentCard 
                        key={doc.id} 
                        doc={doc} 
                        box={boxes.find(b => b.documentIds.includes(doc.id))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'archive-list' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                          type="text" 
                          placeholder="Pencarian global..." 
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <select 
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <option value="Semua">Semua Jenis</option>
                        {Array.from(new Set(documents.map(d => d.archiveType))).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <select 
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none"
                        onChange={(e) => {
                          const unit = e.target.value;
                          if (unit === 'Semua') {
                            setSearchQuery('');
                          } else {
                            setSearchQuery(unit);
                          }
                        }}
                      >
                        <option value="Semua">Semua Unit</option>
                        {DJKI_UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => window.print()}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        Cetak Daftar
                      </button>
                      <button 
                        onClick={exportToExcel}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export Excel
                      </button>
                      <button 
                        onClick={() => setActiveTab('upload')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah Arsip
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Berkas</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan Arsip</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Pengolah</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahun</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDocs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 text-sm font-mono text-slate-600">{doc.fileNumber}</td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-800">{doc.archiveDescription}</p>
                              <p className="text-[10px] text-slate-500">{doc.documentNumber}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{doc.processingUnit}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{doc.archiveYear}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                doc.archiveCategory === 'Vital' ? 'bg-red-100 text-red-700 border-red-200' :
                                doc.archiveCategory === 'Aktif' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                doc.archiveCategory === 'Inaktif' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {doc.archiveCategory}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button 
                                  title="Lihat Detail"
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  onClick={() => setSelectedDocForView(doc)}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  title="Edit Arsip"
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  onClick={() => setSelectedDocForEdit(doc)}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  title="Hapus Arsip"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  onClick={() => {
                                    if(confirm('Apakah Anda yakin ingin menghapus arsip ini?')) {
                                      setDocuments(documents.filter(d => d.id !== doc.id));
                                    }
                                  }}
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
                  {filteredDocs.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                      <div className="text-6xl mb-4">🏜️</div>
                      <p className="font-medium">Tidak ada data ditemukan</p>
                    </div>
                  )}
                </div>

                {selectedDocForView && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                      <div className="bg-white rounded-3xl p-6 relative">
                        <button 
                          onClick={() => setSelectedDocForView(null)}
                          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                        >
                          ✕
                        </button>
                        <DocumentCard 
                          doc={selectedDocForView} 
                          box={boxes.find(b => b.documentIds.includes(selectedDocForView.id))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedDocForEdit && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                      <div className="bg-white rounded-3xl p-8 relative shadow-2xl">
                        <button 
                          onClick={() => setSelectedDocForEdit(null)}
                          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                        >
                          ✕
                        </button>
                        
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl">
                            📝
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-slate-800">Edit Metadata Arsip</h3>
                            <p className="text-slate-500 text-sm">Perbarui informasi berkas {selectedDocForEdit.fileNumber}</p>
                          </div>
                        </div>

                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            setDocuments(documents.map(d => d.id === selectedDocForEdit.id ? selectedDocForEdit : d));
                            setSelectedDocForEdit(null);
                          }}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Keterangan Arsip</label>
                              <input 
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                value={selectedDocForEdit.archiveDescription}
                                onChange={(e) => setSelectedDocForEdit({...selectedDocForEdit, archiveDescription: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Unit Pengolah</label>
                              <select 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                value={selectedDocForEdit.processingUnit}
                                onChange={(e) => setSelectedDocForEdit({...selectedDocForEdit, processingUnit: e.target.value})}
                              >
                                {DJKI_UNITS.map(unit => (
                                  <option key={unit} value={unit}>{unit}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tahun</label>
                              <input 
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                value={selectedDocForEdit.archiveYear}
                                onChange={(e) => setSelectedDocForEdit({...selectedDocForEdit, archiveYear: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Kategori</label>
                              <select 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                value={selectedDocForEdit.archiveCategory}
                                onChange={(e) => setSelectedDocForEdit({...selectedDocForEdit, archiveCategory: e.target.value as any})}
                              >
                                <option value="Vital">Vital</option>
                                <option value="Aktif">Aktif</option>
                                <option value="Inaktif">Inaktif</option>
                                <option value="Statis">Statis</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">No. Box</label>
                              <input 
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                value={selectedDocForEdit.boxNumber}
                                onChange={(e) => setSelectedDocForEdit({...selectedDocForEdit, boxNumber: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Lokasi (Gedung)</label>
                              <input 
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                value={selectedDocForEdit.building}
                                onChange={(e) => setSelectedDocForEdit({...selectedDocForEdit, building: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div className="pt-6 flex gap-3">
                            <button 
                              type="button"
                              onClick={() => setSelectedDocForEdit(null)}
                              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                            >
                              Batal
                            </button>
                            <button 
                              type="submit"
                              className="flex-1 py-3 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all"
                            >
                              Simpan Perubahan
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                      <input 
                        type="text" 
                        placeholder="Cari berdasarkan nama, nomor pendaftaran, atau pemohon..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select 
                      className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option>Semua</option>
                      <option>Sertifikat</option>
                      <option>Kutipan</option>
                      <option>Permohonan</option>
                      <option>Sanggahan</option>
                      <option>Tolakan</option>
                      <option>SK</option>
                      <option>Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredDocs.length > 0 ? (
                    filteredDocs.map(doc => (
                      <DocumentCard 
                        key={doc.id} 
                        doc={doc} 
                        box={boxes.find(b => b.documentIds.includes(doc.id))}
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                       <div className="text-6xl mb-4">🏜️</div>
                       <p className="font-medium">Tidak ada dokumen yang ditemukan</p>
                       <p className="text-xs">Coba gunakan kata kunci atau filter lain.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="max-w-3xl mx-auto">
                {uploadSuccess ? (
                  <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce">
                      ✅
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Berhasil Diarsipkan!</h3>
                    <p className="text-slate-500 mb-8">Dokumen Anda telah berhasil diproses dan disimpan ke dalam sistem.</p>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 animate-progress"></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Mengalihkan ke daftar berkas...</p>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl text-white shadow-lg shadow-blue-200">
                          📤
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-slate-800">Arsipkan Berkas Baru</h3>
                          <p className="text-slate-500 text-sm">Lengkapi metadata berkas untuk pemrosesan otomatis.</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-10">
                      {/* Section 1: Identitas Arsip */}
                      <div>
                        <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">1</span>
                          Identitas Arsip
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Nomor Berkas</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="F-2024-XXX"
                              value={newDoc.fileNumber}
                              onChange={(e) => setNewDoc({...newDoc, fileNumber: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Nomor Item Arsip</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="ITEM-01"
                              value={newDoc.archiveItemNumber}
                              onChange={(e) => setNewDoc({...newDoc, archiveItemNumber: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">No. Box</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="BOX-2024-XXX"
                              value={newDoc.boxNumber}
                              onChange={(e) => setNewDoc({...newDoc, boxNumber: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Kategori Arsip</label>
                            <select 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              value={newDoc.archiveCategory}
                              onChange={(e) => setNewDoc({...newDoc, archiveCategory: e.target.value as any})}
                            >
                              <option value="Vital">Vital</option>
                              <option value="Aktif">Aktif</option>
                              <option value="Inaktif">Inaktif</option>
                              <option value="Statis">Statis</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Kode Klasifikasi Arsip</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="HK.01.01"
                              value={newDoc.classificationCode}
                              onChange={(e) => setNewDoc({...newDoc, classificationCode: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Bentuk Naskah</label>
                            <select 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              value={newDoc.documentForm}
                              onChange={(e) => setNewDoc({...newDoc, documentForm: e.target.value as any})}
                            >
                              <option value="Asli">Asli</option>
                              <option value="Salinan">Salinan</option>
                              <option value="Scan">Scan</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Informasi Arsip */}
                      <div>
                        <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">2</span>
                          Informasi Arsip
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Nama Pegawai / Pemohon</label>
                            <input 
                              required
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="Nama Lengkap"
                              value={newDoc.name}
                              onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">NIP / Pemohon</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="NIP atau Identitas"
                              value={newDoc.nipOrApplicant}
                              onChange={(e) => setNewDoc({...newDoc, nipOrApplicant: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Jenis Arsip</label>
                            <input 
                              required
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="SK, Sertifikat, Permohonan, dll"
                              value={newDoc.archiveType}
                              onChange={(e) => setNewDoc({...newDoc, archiveType: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Keterangan Arsip</label>
                            <input 
                              required
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="Penjelasan isi arsip"
                              value={newDoc.archiveDescription}
                              onChange={(e) => setNewDoc({...newDoc, archiveDescription: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Nomor Dokumen</label>
                            <input 
                              required
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="No. Surat / Sertifikat"
                              value={newDoc.documentNumber}
                              onChange={(e) => setNewDoc({...newDoc, documentNumber: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Tanggal Dokumen</label>
                            <input 
                              required
                              type="date" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              value={newDoc.documentDate}
                              onChange={(e) => setNewDoc({...newDoc, documentDate: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Status Arsip */}
                      <div>
                        <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">3</span>
                          Status Arsip
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Tingkat Perkembangan</label>
                            <select 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              value={newDoc.developmentLevel}
                              onChange={(e) => setNewDoc({...newDoc, developmentLevel: e.target.value as any})}
                            >
                              <option value="Asli">Asli</option>
                              <option value="Copy">Copy</option>
                              <option value="Draft">Draft</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Ket. Klasifikasi Keamanan</label>
                            <select 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              value={newDoc.securityClassification}
                              onChange={(e) => setNewDoc({...newDoc, securityClassification: e.target.value as any})}
                            >
                              <option value="Terbuka">Terbuka</option>
                              <option value="Terbatas">Terbatas</option>
                              <option value="Rahasia">Rahasia</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Lokasi Penyimpanan */}
                      <div>
                        <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">4</span>
                          Lokasi Penyimpanan
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Gedung</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="Gedung A"
                              value={newDoc.building}
                              onChange={(e) => setNewDoc({...newDoc, building: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Lantai</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="1"
                              value={newDoc.floor}
                              onChange={(e) => setNewDoc({...newDoc, floor: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Lemari</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="C-01"
                              value={newDoc.cabinet}
                              onChange={(e) => setNewDoc({...newDoc, cabinet: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Rak / Shelf</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="Rak 1"
                              value={newDoc.shelf}
                              onChange={(e) => setNewDoc({...newDoc, shelf: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Map / Folder</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="Map 01"
                              value={newDoc.mapOrFolder}
                              onChange={(e) => setNewDoc({...newDoc, mapOrFolder: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Field Tambahan */}
                      <div>
                        <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">5</span>
                          Field Tambahan
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Tahun Arsip</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="2024"
                              value={newDoc.archiveYear}
                              onChange={(e) => setNewDoc({...newDoc, archiveYear: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Unit Pengolah</label>
                            <select 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              value={newDoc.processingUnit}
                              onChange={(e) => setNewDoc({...newDoc, processingUnit: e.target.value})}
                            >
                              <option value="">Pilih Unit Pengolah</option>
                              {DJKI_UNITS.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Retensi Arsip</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                              placeholder="Masa Simpan"
                              value={newDoc.retentionPeriod}
                              onChange={(e) => setNewDoc({...newDoc, retentionPeriod: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Keterangan Tambahan</label>
                            <textarea 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all resize-none"
                              placeholder="Catatan tambahan"
                              rows={2}
                              value={newDoc.additionalNotes}
                              onChange={(e) => setNewDoc({...newDoc, additionalNotes: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="relative group">
                        <input 
                          type="file" 
                          id="file-upload"
                          className="hidden" 
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.png"
                        />
                        <label 
                          htmlFor="file-upload"
                          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                            selectedFile 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110 ${
                            selectedFile ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 shadow-sm'
                          }`}>
                            {selectedFile ? '📄' : '☁️'}
                          </div>
                          <p className="text-sm font-bold text-slate-700">
                            {selectedFile ? selectedFile.name : 'Unggah Dokumen Pendukung'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {selectedFile 
                              ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Klik untuk ganti` 
                              : 'Tarik berkas PDF/Gambar di sini atau klik untuk memilih'}
                          </p>
                        </label>
                        {selectedFile && (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedFile(null);
                            }}
                            className="absolute top-4 right-4 p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit" 
                          disabled={isUploading}
                          className={`w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-3 transition-all relative overflow-hidden ${
                            isUploading 
                              ? 'bg-slate-400 cursor-not-allowed' 
                              : 'bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200'
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span className="animate-pulse">Menyimpan Dokumen...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xl">✨</span>
                              <span>Simpan & Proses Arsip</span>
                            </>
                          )}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
                          Data akan dienkripsi dan diproses secara aman
                        </p>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'labels' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">🏷️</span> Konfigurasi Label Box
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Pilih Box Arsip</label>
                          <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onChange={(e) => {
                              const box = boxes.find(b => b.id === e.target.value);
                              if (box) setSelectedBox(box);
                              else setSelectedBox(null);
                            }}
                          >
                            <option value="">Pilih Box...</option>
                            {boxes.map(box => (
                              <option key={box.id} value={box.id}>{box.boxNumber} - {box.location}</option>
                            ))}
                          </select>
                        </div>

                        {selectedBox && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Unit Pengolah</label>
                              <select 
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                value={selectedBox.processingUnit || ''}
                                onChange={(e) => setSelectedBox({...selectedBox, processingUnit: e.target.value})}
                              >
                                <option value="">Pilih Unit...</option>
                                {DJKI_UNITS.map(unit => (
                                  <option key={unit} value={unit}>{unit}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Range Tahun</label>
                              <input 
                                type="text"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                placeholder="Contoh: 2020 - 2024"
                                value={selectedBox.yearRange || ''}
                                onChange={(e) => setSelectedBox({...selectedBox, yearRange: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Lokasi</label>
                              <input 
                                type="text"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                value={selectedBox.location || ''}
                                onChange={(e) => setSelectedBox({...selectedBox, location: e.target.value})}
                              />
                            </div>
                          </div>
                        )}

                        <button 
                          disabled={!selectedBox}
                          onClick={() => window.print()}
                          className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                          <Printer className="w-4 h-4" />
                          Cetak Label Box
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="text-xl">💡</span> Petunjuk
                      </h3>
                      <ul className="space-y-3">
                        {[
                          'Pilih nomor box dari dropdown di atas.',
                          'Sesuaikan metadata box jika diperlukan.',
                          'Sistem akan otomatis meng-generate QR Code.',
                          'Gunakan printer label standar untuk hasil terbaik.'
                        ].map((text, i) => (
                          <li key={i} className="flex gap-3 text-xs text-slate-500">
                            <span className="text-blue-500 font-bold">{i+1}.</span>
                            {text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    {selectedBox ? (
                      <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[500px] print:shadow-none print:border-none print:p-0">
                        <div id="printable-label" className="w-full max-w-[75mm] h-[38mm] border-2 border-slate-900 p-2 rounded-none flex flex-row items-center gap-3 bg-white overflow-hidden print:border-slate-900">
                          {/* Left Side: QR Code */}
                          <div className="flex-shrink-0 bg-white p-1 border border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <QRCodeSVG 
                              value={JSON.stringify({
                                boxId: selectedBox.id,
                                boxNumber: selectedBox.boxNumber,
                                location: selectedBox.location,
                                processingUnit: selectedBox.processingUnit,
                                yearRange: selectedBox.yearRange,
                                titles: documents.filter(d => selectedBox.documentIds.includes(d.id)).map(d => d.archiveDescription)
                              })} 
                              size={100}
                              level="H"
                            />
                          </div>
                          
                          {/* Right Side: Information */}
                          <div className="flex-1 flex flex-col justify-between h-full text-left overflow-hidden">
                            <div className="flex items-center gap-2 mb-1">
                              <img 
                                src="https://lh3.googleusercontent.com/d/1he5AoYAHMd9dlg47zLlR_-vSX_tQ9u95" 
                                alt="DJKI" 
                                className="w-6 h-6 object-contain"
                                referrerPolicy="no-referrer"
                              />
                              <div className="leading-none">
                                <h2 className="text-[10px] font-black text-slate-900">DJKI</h2>
                                <p className="text-[6px] font-bold text-slate-500 uppercase tracking-tighter">Arsip Digital KI</p>
                              </div>
                            </div>
                            
                            <div className="border-t border-slate-900 pt-1">
                              <h1 className="text-xl font-black text-slate-900 leading-none truncate tracking-tighter">{selectedBox.boxNumber}</h1>
                              <p className="text-[6px] font-bold text-slate-400 uppercase tracking-[0.2em]">Label Box Arsip</p>
                            </div>
                            
                            <div className="mt-1 space-y-0.5">
                              <div className="flex flex-col">
                                <span className="text-[5px] font-black text-slate-400 uppercase">Unit Pengolah</span>
                                <p className="text-[7px] font-bold text-slate-800 truncate leading-tight">{selectedBox.processingUnit || 'N/A'}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                <div>
                                  <span className="text-[5px] font-black text-slate-400 uppercase">Lokasi</span>
                                  <p className="text-[7px] font-bold text-slate-800 truncate leading-tight">{selectedBox.location}</p>
                                </div>
                                <div>
                                  <span className="text-[5px] font-black text-slate-400 uppercase">Tahun</span>
                                  <p className="text-[7px] font-bold text-slate-800 truncate leading-tight">{selectedBox.yearRange || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-auto pt-1 border-t border-slate-100 flex justify-between items-end">
                              <span className="text-[5px] text-slate-300 font-mono uppercase">
                                {new Date().toLocaleDateString()}
                              </span>
                              <span className="text-[4px] text-slate-200 font-mono">T&J 121</span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-8 text-slate-400 text-xs italic print:hidden">Pratinjau label Tom & Jerry No. 121 (38x75mm)</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center min-h-[500px] text-slate-400">
                        <div className="text-6xl mb-4">🏷️</div>
                        <p className="font-medium">Pilih box untuk melihat pratinjau label</p>
                        <p className="text-xs mt-2">Gunakan menu dropdown di sebelah kiri</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scanner' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                      <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">📷</span>
                        Scanner Label Box
                      </h3>
                      
                      <div id="reader" className="overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 aspect-square flex items-center justify-center">
                        <div className="text-center p-8">
                          <p className="text-slate-400 text-sm">Menginisialisasi kamera...</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                        <span className="text-xl">💡</span>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Posisikan QR Code di tengah kotak scanner. Pastikan pencahayaan cukup untuk hasil scan yang akurat.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {scannedBoxData ? (
                      <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">
                                📦
                              </div>
                              <div>
                                <h3 className="font-black text-2xl text-slate-800">{scannedBoxData.boxNumber}</h3>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Box Teridentifikasi</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => setScannedBoxData(null)}
                             className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                           >
                             ✕
                           </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ID Sistem</p>
                            <p className="text-sm font-mono font-bold text-slate-700">{scannedBoxData.boxId}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lokasi Fisik</p>
                            <p className="text-sm font-bold text-slate-700">{scannedBoxData.location || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Isi Box ({scannedBoxData.titles.length} Dokumen)</p>
                          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                            {scannedBoxData.titles.map((title, i) => (
                              <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3 group hover:border-blue-200 transition-colors">
                                <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold group-hover:bg-blue-100 group-hover:text-blue-600">
                                  {i + 1}
                                </div>
                                <p className="text-xs font-medium text-slate-600 truncate">{title}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                          <button 
                            onClick={() => {
                              setSearchQuery(scannedBoxData.boxNumber);
                              setActiveTab('archive-list');
                            }}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                          >
                            Lihat Semua Isi
                          </button>
                          <button 
                            onClick={() => setScannedBoxData(null)}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                          >
                            Scan Ulang
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="font-medium">Menunggu hasil scan...</p>
                        <p className="text-xs mt-2">Arahkan kamera ke QR Code pada label box</p>
                      </div>
                    )}

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-xl">📋</span> Riwayat Scan Terakhir
                        </h3>
                        {scanHistory.length > 0 && (
                          <button 
                            onClick={() => setScanHistory([])}
                            className="text-[10px] font-bold text-red-500 hover:underline uppercase tracking-widest"
                          >
                            Hapus Semua
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {scanHistory.length > 0 ? (
                          scanHistory.map((item, i) => (
                            <div 
                              key={i} 
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:border-blue-200 transition-all cursor-pointer group"
                              onClick={() => setScannedBoxData(item)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sm shadow-sm group-hover:bg-blue-50 group-hover:border-blue-100">
                                  📦
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{item.boxNumber}</p>
                                  <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                                </div>
                              </div>
                              <span className="text-slate-300 group-hover:text-blue-500 transition-colors">→</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center py-8 text-slate-400 text-xs italic">
                            Belum ada riwayat scan pada sesi ini.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'Sertifikat', count: filteredDocs.filter(d => d.archiveType === 'Sertifikat').length, icon: '📜', color: 'bg-emerald-500', desc: 'Dokumen bukti pendaftaran resmi yang telah disetujui.' },
                    { name: 'Kutipan', count: filteredDocs.filter(d => d.archiveType === 'Kutipan').length, icon: '📄', color: 'bg-blue-500', desc: 'Salinan resmi dari buku daftar umum kekayaan intelektual.' },
                    { name: 'Permohonan', count: filteredDocs.filter(d => d.archiveType === 'Permohonan').length, icon: '📝', color: 'bg-indigo-500', desc: 'Berkas pendaftaran yang sedang dalam tahap pemeriksaan.' },
                    { name: 'Sanggahan', count: filteredDocs.filter(d => d.archiveType === 'Sanggahan').length, icon: '⚖️', color: 'bg-amber-500', desc: 'Dokumen tanggapan atas usulan penolakan dari pemeriksa.' },
                    { name: 'Tolakan', count: filteredDocs.filter(d => d.archiveType === 'Tolakan').length, icon: '🚫', color: 'bg-red-500', desc: 'Surat pemberitahuan penolakan resmi dari DJKI.' },
                    { name: 'Lainnya', count: filteredDocs.filter(d => d.archiveType === 'Lainnya').length, icon: '📁', color: 'bg-slate-500', desc: 'Dokumen pendukung lainnya yang tidak termasuk kategori utama.' },
                  ].map((cat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 ${cat.color} text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                          {cat.icon}
                        </div>
                        <span className="text-2xl font-black text-slate-200">{cat.count}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg mb-1">{cat.name}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{cat.desc}</p>
                      <button className="mt-4 text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
                        Kelola Arsip <span className="text-[10px]">→</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <span>📈</span> Tren Pertumbuhan Arsip (6 Bulan Terakhir)
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Sep', count: 45 },
                          { name: 'Okt', count: 52 },
                          { name: 'Nov', count: 38 },
                          { name: 'Des', count: 65 },
                          { name: 'Jan', count: 48 },
                          { name: 'Feb', count: filteredDocs.length + 10 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <span>🍰</span> Distribusi Kategori Arsip
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Sertifikat', value: filteredDocs.filter(d => d.archiveType === 'Sertifikat').length },
                              { name: 'Kutipan', value: filteredDocs.filter(d => d.archiveType === 'Kutipan').length },
                              { name: 'Permohonan', value: filteredDocs.filter(d => d.archiveType === 'Permohonan').length },
                              { name: 'Sanggahan', value: filteredDocs.filter(d => d.archiveType === 'Sanggahan').length },
                              { name: 'Tolakan', value: filteredDocs.filter(d => d.archiveType === 'Tolakan').length },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ef4444'].map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800">Ringkasan Kinerja Sistem</h3>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Uptime 99.9%</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Waktu Proses Rata-rata</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-800">0.2s <span className="text-xs text-emerald-500 font-bold">Optimal</span></p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Dokumen Terarsip</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-800">1,284 <span className="text-xs text-blue-500 font-bold">↑ 12%</span></p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Efisiensi Ruang</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-800">85% <span className="text-xs text-emerald-500 font-bold">Tinggi</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-6xl mx-auto space-y-8">
                {/* User Management Section */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-2xl text-slate-800 tracking-tight">Manajemen Pengguna</h3>
                      <p className="text-slate-500 text-sm">Kelola akses administrator dan unit pengolah.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const name = prompt('Nama Lengkap:');
                        const username = prompt('Username:');
                        const role = prompt('Role (SUPERADMIN/UNIT_ADMIN):') as Role;
                        if (name && username && role) {
                          handleAddUser({
                            id: Date.now().toString(),
                            name,
                            username,
                            role,
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
                          });
                        }
                      }}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                      <Plus className="w-4 h-4" /> Tambah User
                    </button>
                  </div>
                  
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {users.map(user => (
                        <div key={user.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center relative group">
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-2xl mb-4 bg-white p-1 shadow-sm" />
                          <h4 className="font-bold text-slate-800">{user.name}</h4>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{user.role}</p>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-1">{user.processingUnit || 'Akses Global'}</p>
                          <div className="mt-4 pt-4 border-t border-slate-200 w-full flex justify-center gap-4">
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                              <p className="text-xs font-bold text-emerald-600">Aktif</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Akses</p>
                              <p className="text-xs font-bold text-slate-700">{user.role === 'SUPERADMIN' ? 'Full' : 'Unit'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* System Configuration Section */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-black text-2xl text-slate-800 tracking-tight">Konfigurasi Vault</h3>
                    <p className="text-slate-500 text-sm">Pengaturan keamanan dan alur kerja sistem.</p>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">🛡️</div>
                          <div>
                            <p className="font-bold text-slate-800">Enkripsi Metadata</p>
                            <p className="text-xs text-slate-500">Amankan data arsip dengan enkripsi AES-256.</p>
                          </div>
                        </div>
                        <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">👁️</div>
                          <div>
                            <p className="font-bold text-slate-800">Audit Log</p>
                            <p className="text-xs text-slate-500">Catat setiap aktivitas akses dan perubahan.</p>
                          </div>
                        </div>
                        <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                      <button className="px-8 py-4 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-2xl transition-colors">Reset Default</button>
                      <button className="px-8 py-4 bg-[#0f172a] text-white font-black text-sm rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Simpan Konfigurasi</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
