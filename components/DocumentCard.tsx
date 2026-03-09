
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { IntellectualPropertyDoc, ArchiveBox } from '../types';
import { SECURITY_COLORS, DEVELOPMENT_COLORS, FORM_COLORS, CATEGORY_COLORS, TYPE_COLORS } from '../constants';

interface DocumentCardProps {
  doc: IntellectualPropertyDoc;
  box?: ArchiveBox;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, box }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
        
        <div className="flex justify-between items-start mb-5 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${SECURITY_COLORS[doc.securityClassification]}`}>
                {doc.securityClassification}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${CATEGORY_COLORS[doc.archiveCategory]}`}>
                {doc.archiveCategory}
              </span>
            </div>
            <h4 className="font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors text-lg tracking-tight">
              {doc.archiveDescription}
            </h4>
            <p className="text-xs text-slate-500 font-bold mt-1">ID: <span className="font-mono text-blue-600">{doc.documentNumber}</span></p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border border-slate-100">
              📄
            </div>
          </div>
        </div>
        
        <div className="space-y-3 mb-6 relative z-10">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-slate-400">Pemohon</span>
              <span className="text-slate-800 truncate ml-2">{doc.name}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-slate-400">Tahun</span>
              <span className="text-slate-800">{doc.archiveYear}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm shadow-sm border border-blue-100">
              📍
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lokasi Vault</p>
              <p className="text-xs font-black text-slate-800 truncate">{doc.building}, L{doc.floor}, {doc.cabinet}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-black py-3 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            DETAIL
          </button>
          <button className="flex-1 bg-[#0f172a] text-white text-xs font-black py-3 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            BUKA
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${SECURITY_COLORS[doc.securityClassification]}`}>
                    {doc.securityClassification.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${CATEGORY_COLORS[doc.archiveCategory]}`}>
                    {doc.archiveCategory.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${DEVELOPMENT_COLORS[doc.developmentLevel]}`}>
                    {doc.developmentLevel.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${FORM_COLORS[doc.documentForm]}`}>
                    {doc.documentForm.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">{doc.archiveDescription}</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Nomor Dokumen: <span className="font-mono">{doc.documentNumber}</span></p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama / Pemohon</h4>
                  <p className="text-slate-800 font-medium text-sm">{doc.name}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NIP / Pemohon</h4>
                  <p className="text-slate-800 font-medium text-sm">{doc.nipOrApplicant}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tahun Arsip</h4>
                  <p className="text-slate-800 font-medium text-sm">{doc.archiveYear}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Berkas</h4>
                  <p className="text-slate-800 font-medium text-sm">{doc.fileNumber}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Item</h4>
                  <p className="text-slate-800 font-medium text-sm">{doc.archiveItemNumber}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kode Klasifikasi</h4>
                  <p className="text-slate-800 font-medium text-sm">{doc.classificationCode}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jenis Arsip</h4>
                  <p className="text-slate-800 font-medium text-sm">{doc.archiveType}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Pengolah</h4>
                  <p className="text-slate-800 font-medium text-sm">{doc.processingUnit}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Retensi Arsip</h4>
                  <p className="text-slate-800 font-medium text-sm">{doc.retentionPeriod}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Lokasi Penyimpanan Fisik</h4>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl shrink-0">
                      📍
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase">Box</p>
                        <p className="text-sm font-bold text-blue-900">{doc.boxNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase">Gedung/Lantai</p>
                        <p className="text-sm font-bold text-blue-900">{doc.building}, L{doc.floor}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase">Lemari/Rak</p>
                        <p className="text-sm font-bold text-blue-900">{doc.cabinet} / {doc.shelf || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase">Map/Folder</p>
                        <p className="text-sm font-bold text-blue-900">{doc.mapOrFolder || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">QR Code Arsip Digital</h4>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <QRCodeSVG 
                      value={JSON.stringify({ 
                        id: doc.id, 
                        docNum: doc.documentNumber, 
                        desc: doc.archiveDescription,
                        loc: `${doc.building}, L${doc.floor}, C${doc.cabinet}`
                      })}
                      size={100}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="mt-3 text-blue-600 text-[10px] font-bold hover:underline"
                  >
                    Cetak Label QR
                  </button>
                </div>
              </div>

              {doc.additionalNotes && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Keterangan Tambahan</h4>
                  <p className="text-slate-600 text-sm italic">"{doc.additionalNotes}"</p>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
              <button className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                Unduh PDF
              </button>
            </div>
          </div>
          {/* Backdrop closer */}
          <div className="fixed inset-0 -z-10" onClick={() => setShowModal(false)}></div>
        </div>
      )}
    </>
  );
};

export default DocumentCard;
