
import React from 'react';

export const COLORS = {
  primary: '#0F172A', // Slate 900
  secondary: '#3B82F6', // Blue 500
  accent: '#F59E0B', // Amber 500
  success: '#10B981', // Emerald 500
  danger: '#EF4444', // Red 500
};

export const TYPE_COLORS: Record<string, string> = {
  'Sertifikat': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Kutipan': 'bg-blue-100 text-blue-700 border-blue-200',
  'Permohonan': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Sanggahan': 'bg-amber-100 text-amber-700 border-amber-200',
  'Tolakan': 'bg-red-100 text-red-700 border-red-200',
  'Lainnya': 'bg-slate-100 text-slate-700 border-slate-200',
};

export const SECURITY_COLORS: Record<string, string> = {
  'Terbuka': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Terbatas': 'bg-amber-50 text-amber-700 border-amber-200',
  'Rahasia': 'bg-red-50 text-red-700 border-red-200',
};

export const DEVELOPMENT_COLORS: Record<string, string> = {
  'Asli': 'bg-blue-50 text-blue-700 border-blue-200',
  'Copy': 'bg-slate-50 text-slate-700 border-slate-200',
  'Draft': 'bg-amber-50 text-amber-700 border-amber-200',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Vital': 'bg-red-100 text-red-700 border-red-200',
  'Aktif': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Inaktif': 'bg-amber-100 text-amber-700 border-amber-200',
  'Statis': 'bg-slate-100 text-slate-700 border-slate-200',
};

export const FORM_COLORS: Record<string, string> = {
  'Asli': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Salinan': 'bg-slate-50 text-slate-700 border-slate-200',
  'Scan': 'bg-cyan-50 text-cyan-700 border-cyan-200',
};
