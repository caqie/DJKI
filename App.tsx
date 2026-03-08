
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import Sidebar from './components/Sidebar';
import StatsOverview from './components/StatsOverview';
import DocumentCard from './components/DocumentCard';
import { IntellectualPropertyDoc, DocCategory } from './types';

const INITIAL_DOCS: IntellectualPropertyDoc[] = [
  {
    id: '1',
    title: 'Sertifikat Merek Kopi Kenangan',
    applicationNumber: 'IDM000987654',
    applicant: 'PT Kenangan Abadi',
    category: 'Sertifikat',
    dateFiled: '2023-11-12',
    status: 'Terdaftar',
    description: 'Sertifikat resmi pendaftaran merek dagang Kopi Kenangan untuk kelas barang 30.'
  },
  {
    id: '2',
    title: 'Permohonan Paten Sistem Filtrasi Limbah',
    applicationNumber: 'P00202301234',
    applicant: 'Universitas Indonesia',
    category: 'Permohonan',
    dateFiled: '2024-01-20',
    status: 'Dalam Proses',
    description: 'Berkas permohonan paten untuk invensi sistem pengolahan limbah cair industri batik.'
  },
  {
    id: '3',
    title: 'Sanggahan Atas Penolakan Merek "GlowUp"',
    applicationNumber: 'IDM000112233',
    applicant: 'CV Cantik Jelita',
    category: 'Sanggahan',
    dateFiled: '2024-02-05',
    status: 'Dalam Proses',
    description: 'Tanggapan tertulis atas usulan penolakan pendaftaran merek GlowUp karena kemiripan pada pokoknya.'
  },
  {
    id: '4',
    title: 'Surat Tolakan Permohonan Desain Industri',
    applicationNumber: 'A00202300556',
    applicant: 'Paguyuban Batik Solo',
    category: 'Tolakan',
    dateFiled: '2023-12-15',
    status: 'Ditolak',
    description: 'Pemberitahuan resmi penolakan permohonan desain industri motif batik karena kurangnya unsur kebaruan.'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState<IntellectualPropertyDoc[]>(INITIAL_DOCS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Form State
  const [newDoc, setNewDoc] = useState({
    title: '',
    applicationNumber: '',
    applicant: '',
    category: 'Permohonan' as DocCategory,
    dateFiled: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.applicant.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'Semua' || doc.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, filterCategory]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadSuccess(false);
    
    try {
      const doc: IntellectualPropertyDoc = {
        id: Math.random().toString(36).substr(2, 9),
        title: newDoc.title,
        applicationNumber: newDoc.applicationNumber || ('PEND-' + Math.floor(10000000 + Math.random() * 90000000)),
        applicant: newDoc.applicant,
        category: newDoc.category,
        dateFiled: newDoc.dateFiled,
        status: 'Draft',
        description: newDoc.description
      };

      setDocuments(prev => [doc, ...prev]);
      setUploadSuccess(true);
      
      // Reset form after a delay
      setTimeout(() => {
        setActiveTab('search');
        setNewDoc({ 
          title: '', 
          applicationNumber: '', 
          applicant: '', 
          category: 'Permohonan', 
          dateFiled: new Date().toISOString().split('T')[0],
          description: '' 
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
    if (activeTab === 'scanner') {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render((decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          if (data.num) {
            setSearchQuery(data.num);
            setActiveTab('search');
            scanner.clear();
          }
        } catch (e) {
          console.error("Invalid QR Code", e);
        }
      }, (error) => {
        // console.warn(error);
      });

      return () => {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      };
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <main className="flex-1 lg:ml-64 p-4 md:p-8 transition-all duration-300">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              ☰
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 capitalize">
                {activeTab === 'dashboard' && 'Dashboard Analitik'}
                {activeTab === 'search' && 'Pencarian Berkas'}
                {activeTab === 'upload' && 'Arsip Baru'}
                {activeTab === 'scanner' && 'Scan Label Box'}
                {activeTab === 'categories' && 'Manajemen Kategori'}
                {activeTab === 'reports' && 'Laporan & Analitik'}
                {activeTab === 'settings' && 'Pengaturan Sistem'}
              </h2>
              <p className="text-slate-500 text-xs md:text-sm">Selamat datang kembali di sistem arsip DJKI.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-end">
             <div className="relative hidden sm:block">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input 
                  type="text" 
                  placeholder="Cari nomor..." 
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-32 md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <button className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-xl hover:bg-slate-50 transition-colors relative">
                🔔
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <button className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-colors">
                👤
             </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Berkas', value: documents.length, color: 'blue', icon: '📁' },
                { label: 'Sertifikat', value: documents.filter(d => d.category === 'Sertifikat').length, color: 'emerald', icon: '📜' },
                { label: 'Permohonan Baru', value: documents.filter(d => d.category === 'Permohonan').length, color: 'purple', icon: '📝' },
                { label: 'Sanggahan', value: documents.filter(d => d.category === 'Sanggahan').length, color: 'amber', icon: '⚖️' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${
                    stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
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
            
            <StatsOverview docs={documents} />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Dokumen Terbaru</h3>
                <button 
                  onClick={() => setActiveTab('search')}
                  className="text-blue-600 text-sm font-bold hover:underline"
                >
                  Lihat Semua →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.slice(0, 3).map(doc => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            </div>
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
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDocs.length > 0 ? (
                filteredDocs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} />
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <AnimatePresence mode="wait">
              {uploadSuccess ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-12 rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-6 animate-bounce">
                    ✅
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Berhasil Diarsipkan!</h3>
                  <p className="text-slate-500 mb-8">Dokumen Anda telah berhasil diproses oleh AI dan disimpan ke dalam sistem.</p>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-progress"></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Mengalihkan ke daftar berkas...</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl text-white shadow-lg shadow-blue-200">
                        📤
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-slate-800">Arsipkan Berkas Baru</h3>
                        <p className="text-slate-500 text-sm">Lengkapi metadata berkas untuk pemrosesan AI otomatis.</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Engine Active</span>
                    </div>
                  </div>

                  <form onSubmit={handleUpload} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Judul Dokumen / Arsip</label>
                        <input 
                          required
                          type="text" 
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                          placeholder="Contoh: Sertifikat Merek Kopi Kenangan"
                          value={newDoc.title}
                          onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Nomor Permohonan / Berkas</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                          placeholder="Contoh: IDM000123456"
                          value={newDoc.applicationNumber}
                          onChange={(e) => setNewDoc({...newDoc, applicationNumber: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Tanggal Dokumen</label>
                        <input 
                          required
                          type="date" 
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                          value={newDoc.dateFiled}
                          onChange={(e) => setNewDoc({...newDoc, dateFiled: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Nama Pemohon / Instansi</label>
                        <input 
                          required
                          type="text" 
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all"
                          placeholder="Nama Individu/Lembaga"
                          value={newDoc.applicant}
                          onChange={(e) => setNewDoc({...newDoc, applicant: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Kategori Arsip DJKI</label>
                        <select 
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all appearance-none"
                          value={newDoc.category}
                          onChange={(e) => setNewDoc({...newDoc, category: e.target.value as DocCategory})}
                        >
                          <option value="Sertifikat">Sertifikat</option>
                          <option value="Kutipan">Kutipan</option>
                          <option value="Permohonan">Permohonan</option>
                          <option value="Sanggahan">Sanggahan</option>
                          <option value="Tolakan">Tolakan</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Deskripsi Singkat / Abstrak</label>
                        <textarea 
                          required
                          rows={4}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all resize-none"
                          placeholder="Tuliskan deskripsi atau abstrak dari kekayaan intelektual..."
                          value={newDoc.description}
                          onChange={(e) => setNewDoc({...newDoc, description: e.target.value})}
                        />
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
                      <motion.label 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
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
                      </motion.label>
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
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
                      </motion.button>
                      <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
                        Data akan dienkripsi dan diproses secara aman
                      </p>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'scanner' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  📷
                </div>
                <h3 className="text-xl font-bold text-slate-800">Scanner Label Box Arsip</h3>
                <p className="text-slate-500 text-sm">Arahkan kamera ke QR Code pada label box untuk melihat detail arsip.</p>
              </div>

              <div id="reader" className="overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50"></div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <span className="text-blue-600 text-lg">💡</span>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Pastikan pencahayaan cukup dan QR Code terlihat jelas di dalam bingkai kamera. 
                  Sistem akan otomatis mengalihkan Anda ke detail berkas setelah pemindaian berhasil.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'categories' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Sertifikat', count: documents.filter(d => d.category === 'Sertifikat').length, icon: '📜', color: 'bg-emerald-500', desc: 'Dokumen bukti pendaftaran resmi yang telah disetujui.' },
                { name: 'Kutipan', count: documents.filter(d => d.category === 'Kutipan').length, icon: '📄', color: 'bg-blue-500', desc: 'Salinan resmi dari buku daftar umum kekayaan intelektual.' },
                { name: 'Permohonan', count: documents.filter(d => d.category === 'Permohonan').length, icon: '📝', color: 'bg-indigo-500', desc: 'Berkas pendaftaran yang sedang dalam tahap pemeriksaan.' },
                { name: 'Sanggahan', count: documents.filter(d => d.category === 'Sanggahan').length, icon: '⚖️', color: 'bg-amber-500', desc: 'Dokumen tanggapan atas usulan penolakan dari pemeriksa.' },
                { name: 'Tolakan', count: documents.filter(d => d.category === 'Tolakan').length, icon: '🚫', color: 'bg-red-500', desc: 'Surat pemberitahuan penolakan resmi dari DJKI.' },
                { name: 'Lainnya', count: documents.filter(d => d.category === 'Lainnya').length, icon: '📁', color: 'bg-slate-500', desc: 'Dokumen pendukung lainnya yang tidak termasuk kategori utama.' },
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
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
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
                      { name: 'Feb', count: documents.length + 10 },
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
                          { name: 'Sertifikat', value: documents.filter(d => d.category === 'Sertifikat').length },
                          { name: 'Kutipan', value: documents.filter(d => d.category === 'Kutipan').length },
                          { name: 'Permohonan', value: documents.filter(d => d.category === 'Permohonan').length },
                          { name: 'Sanggahan', value: documents.filter(d => d.category === 'Sanggahan').length },
                          { name: 'Tolakan', value: documents.filter(d => d.category === 'Tolakan').length },
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
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-xl text-slate-800">Pengaturan Sistem</h3>
                <p className="text-slate-500 text-sm">Konfigurasi alur kerja AI dan manajemen akses arsip.</p>
              </div>
              
              <div className="p-8 space-y-8">
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Konfigurasi Sistem</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-700">Validasi Otomatis</p>
                        <p className="text-xs text-slate-500">Jalankan validasi format segera setelah dokumen diunggah.</p>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Penyimpanan & Keamanan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-200 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Kapasitas Cloud</p>
                      <div className="flex items-end gap-2 mb-2">
                        <p className="text-2xl font-black text-slate-800">1.2 GB</p>
                        <p className="text-xs text-slate-500 mb-1">dari 10 GB</p>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '12%' }}></div>
                      </div>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Enkripsi Data</p>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500 text-xl">🛡️</span>
                        <p className="font-bold text-slate-700">AES-256 Aktif</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-4 flex justify-end gap-3">
                  <button className="px-6 py-3 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">Batalkan</button>
                  <button className="px-6 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Simpan Perubahan</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default App;
