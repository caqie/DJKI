
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { IntellectualPropertyDoc } from '../types';
import { CATEGORY_COLORS, STATUS_COLORS } from '../constants';

interface DocumentCardProps {
  doc: IntellectualPropertyDoc;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${CATEGORY_COLORS[doc.category]}`}>
                {doc.category.toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[doc.status]}`}>
                {doc.status.toUpperCase()}
              </span>
            </div>
            <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
              {doc.title}
            </h4>
            <p className="text-xs text-slate-500 font-medium">#{doc.applicationNumber}</p>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            📄
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Pemohon</span>
            <span className="text-slate-700 font-medium truncate ml-2">{doc.applicant}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Tanggal</span>
            <span className="text-slate-700 font-medium">{doc.dateFiled}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Detail
          </button>
          <button className="flex-1 bg-slate-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors">
            Buka Berkas
          </button>
          <button className="w-10 bg-slate-100 text-slate-600 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center">
            📥
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${CATEGORY_COLORS[doc.category]}`}>
                    {doc.category.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[doc.status]}`}>
                    {doc.status.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">{doc.title}</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Nomor Permohonan: <span className="font-mono">{doc.applicationNumber}</span></p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Informasi Pemohon</h4>
                <p className="text-slate-800 font-medium">{doc.applicant}</p>
                <p className="text-slate-500 text-sm italic">Diajukan pada {doc.dateFiled}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deskripsi Lengkap</h4>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {doc.description}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">QR Code Label Box Arsip</h4>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <QRCodeSVG 
                    value={JSON.stringify({ id: doc.id, num: doc.applicationNumber, title: doc.title })}
                    size={140}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-4 font-mono">{doc.applicationNumber}</p>
                <button 
                  onClick={() => window.print()}
                  className="mt-4 text-blue-600 text-xs font-bold hover:underline"
                >
                  Cetak Label QR
                </button>
              </div>
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
