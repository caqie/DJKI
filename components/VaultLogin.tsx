import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Key, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface VaultLoginProps {
  onLogin: (user: User) => void;
}

const MOCK_USERS: User[] = [
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

const VaultLogin: React.FC<VaultLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    // Simulate authentication delay
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.username === username);
      if (user && password === 'admin123') {
        setIsSuccess(true);
        setTimeout(() => {
          onLogin(user);
        }, 2000);
      } else {
        setError('Username atau password salah');
        setIsAuthenticating(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
      </div>

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div 
            key="login-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            className="w-full max-w-md z-10"
          >
            <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
              {/* Decorative Lines */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
              
              <div className="flex flex-col items-center mb-10">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="w-24 h-24 bg-white p-4 rounded-3xl shadow-2xl shadow-blue-500/20 mb-6 relative group"
                >
                  <img 
                    src="https://lh3.googleusercontent.com/d/1he5AoYAHMd9dlg47zLlR_-vSX_tQ9u95" 
                    alt="DJKI Logo" 
                    className="w-full h-full object-contain transition-transform group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-xl shadow-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-black text-white tracking-tighter mb-1">DJKI VAULT</h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Secure Digital Archive</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <input 
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="Masukkan username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                      <Key className="w-5 h-5" />
                    </div>
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl flex items-center gap-2"
                  >
                    <span>⚠️</span> {error}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 group overflow-hidden relative active:scale-[0.98]"
                >
                  {isAuthenticating ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>BUKA BRANKAS</span>
                      <Lock className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-white/5 text-center">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  Direktorat Jenderal Kekayaan Intelektual
                </p>
              </div>
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
                <p className="text-slate-500 text-xs mt-2">Membuka Brankas Arsip...</p>
              </motion.div>
            </div>

            {/* Light Beam Effect */}
            <motion.div 
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="absolute inset-0 bg-white z-50 origin-center"
            ></motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VaultLogin;
