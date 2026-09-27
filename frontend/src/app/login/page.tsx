'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { ShieldCheck, UserCheck, Lock, ArrowRight, Leaf, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_LOGIN !== 'false'; // Default enabled in dev

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Ghanshyam@2026');
    setError('');
    setLoading(true);
    try {
      await login(roleEmail, 'Ghanshyam@2026');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ayurveda-950 via-ayurveda-900 to-ayurveda-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Ayurvedic Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-ayurveda-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Branding Hero Section */}
        <div className="lg:col-span-6 space-y-6 text-white p-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ayurveda-800/80 border border-ayurveda-600/50 text-gold-400 text-xs font-semibold uppercase tracking-wider">
            <Leaf className="w-4 h-4 text-gold-400 animate-pulse" /> Ghanshyam Ayurvedic Pharmacy
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Ayurvedic ERP <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-emerald-300 to-teal-200">
              Manufacturing & Trading
            </span>
          </h1>

          <p className="text-ayurveda-200 text-sm leading-relaxed max-w-md">
            Real-time batch production control, double-entry inventory ledger, BOM formulations, automated RM requisitions, and accountant WhatsApp CA exports.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ayurveda-800">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Full Traceability</h4>
                <p className="text-xs text-ayurveda-300">Raw Herbs → Batch KAY-2026 → Customer</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">CA WhatsApp Export</h4>
                <p className="text-xs text-ayurveda-300">Instant PDF & Excel audit package</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Login Card & Quick Login Switcher */}
        <div className="lg:col-span-6 bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-ayurveda-950">Enterprise Portal Login</h2>
            <p className="text-xs text-gray-500 mt-1">Authenticate with your department credentials</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@ghanshyamerp.local"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ayurveda-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-ayurveda-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-ayurveda-700 hover:bg-ayurveda-800 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-ayurveda-900/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Authenticate via NestJS API <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Section (Dev Mode Switcher) */}
          {isDemoMode && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-ayurveda-700 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-gold-500" /> Quick Login Cards (Development Mode)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">REAL API AUTH</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { role: 'Sales', email: 'sales@ghanshyamerp.local', color: 'hover:border-blue-400 hover:bg-blue-50/60' },
                  { role: 'Stock Manager', email: 'stock@ghanshyamerp.local', color: 'hover:border-emerald-400 hover:bg-emerald-50/60' },
                  { role: 'Accountant', email: 'accounts@ghanshyamerp.local', color: 'hover:border-purple-400 hover:bg-purple-50/60' },
                  { role: 'Production', email: 'production@ghanshyamerp.local', color: 'hover:border-amber-400 hover:bg-amber-50/60' },
                  { role: 'Super Admin', email: 'admin@ghanshyamerp.local', color: 'hover:border-rose-400 hover:bg-rose-50/60', fullWidth: true },
                ].map((card) => {
                  const isThisCardLoading = loading && email === card.email;
                  return (
                    <button
                      key={card.email}
                      type="button"
                      onClick={() => handleQuickLogin(card.email)}
                      disabled={loading}
                      className={`p-3 text-left border border-gray-200 rounded-xl transition-all cursor-pointer flex items-center justify-between active:scale-[0.98] ${card.color} ${
                        card.fullWidth ? 'sm:col-span-2' : ''
                      } ${isThisCardLoading ? 'bg-ayurveda-50 border-ayurveda-500 shadow-sm' : 'bg-white'}`}
                    >
                      <div>
                        <div className="text-xs font-bold text-gray-900">{card.role}</div>
                        <div className="text-[11px] text-gray-500 font-mono truncate">{card.email}</div>
                      </div>
                      {isThisCardLoading ? (
                        <div className="w-4 h-4 border-2 border-ayurveda-700 border-t-transparent rounded-full animate-spin shrink-0"></div>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
