'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, Mail, Lock, Phone, Smartphone } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithPhone, verifyPhoneOtp } from '../services/supabaseService';

type AuthMethod = 'email' | 'phone';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

const inputCls =
  'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none bg-white transition placeholder-slate-300 font-mono';

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
}) => {
  const [method, setMethod] = useState<AuthMethod>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setError(null);
    setEmail('');
    setPassword('');
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setIsSignUp(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let user;
      if (isSignUp) {
        user = await signUpWithEmail(email, password);
      } else {
        user = await signInWithEmail(email, password);
      }
      
      if (user) { onUnlockSuccess(); onClose(); }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!otpSent) {
        await signInWithPhone(phone);
        setOtpSent(true);
      } else {
        const user = await verifyPhoneOtp(phone, otp);
        if (user) { onUnlockSuccess(); onClose(); }
      }
    } catch (err: any) {
      setError(err.message || 'Phone authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      // Google Auth redirects, so we don't call onUnlockSuccess() here immediately
    } catch (err: any) {
      setError(err.message || 'Google Auth failed.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">
              Owner Sign-In
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          
          {/* Method Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => { setMethod('email'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${method === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Email
            </button>
            <button
              onClick={() => { setMethod('phone'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${method === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Phone
            </button>
          </div>

          {method === 'email' ? (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@example.com"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Authenticating…' : (isSignUp ? 'Create Account' : 'Sign In with Email')}
              </button>
              
              <div className="text-center mt-3">
                 <button 
                   type="button"
                   onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                   className="text-xs text-blue-600 hover:underline"
                 >
                   {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                 </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePhoneAuth} className="space-y-4">
              {!otpSent ? (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1234567890"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Enter OTP</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <ShieldAlert className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Authenticating…' : (otpSent ? 'Verify OTP' : 'Send OTP Code')}
              </button>
            </form>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <p className="text-center text-[11px] text-slate-400 pt-2">
            Only the registered owner can write data to Supabase.
          </p>
        </div>
      </div>
    </div>
  );
};
