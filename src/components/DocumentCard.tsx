import React from 'react';
import { FileText, Calendar, MapPin, Box } from 'lucide-react';
import { IntellectualPropertyDoc, ArchiveBox } from '../types';

interface DocumentCardProps {
  doc: IntellectualPropertyDoc;
  box?: ArchiveBox;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, box }) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <FileText className="w-6 h-6" />
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          doc.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {doc.status}
        </span>
      </div>
      
      <h4 className="font-black text-slate-800 mb-2 line-clamp-2 leading-tight min-h-[2.5rem]">
        {doc.archiveDescription}
      </h4>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{doc.year}</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400">
          <Box className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">Box: {doc.boxNumber || 'Belum di-box'}</span>
        </div>

        {box && (
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{box.location}</span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Unit</span>
          <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{doc.processingUnit}</span>
        </div>
        <button className="text-blue-600 font-black text-xs hover:underline">Detail</button>
      </div>
    </div>
  );
};

export default DocumentCard;
