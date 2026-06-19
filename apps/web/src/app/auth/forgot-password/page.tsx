"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthProvider';
import { GlassInput } from '@/components/ui/GlassInput';
import { PeachButton } from '@/components/ui/PeachButton';
import { Toast } from '@/components/ui/Toast';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const MailIcon = () => (
  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#FF9F7C" opacity="0.15"/>
    <circle cx="20" cy="11" r="3.5" fill="#FF9F7C"/>
    <circle cx="25" cy="17" r="2.5" fill="#FFCFBB"/>
    <path d="M14 28 Q14 20 20 18 Q24 16 26 20 Q28 24 24 26 Q20 28 14 28Z" fill="#FF9F7C" opacity="0.85"/>
  </svg>
);

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setErrorToast(null);
    setSuccessMsg(null);
    try {
      await resetPassword(data.email);
      setSuccessMsg("Recovery link sent. Check your inbox (and spam folder).");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      let errMsg = "Failed to send reset email. Please try again.";
      if (firebaseError?.code === 'auth/user-not-found') {
        errMsg = "No account found with this email address.";
      }
      setErrorToast(errMsg);
      setTimeout(() => setErrorToast(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0E0705] flex items-center justify-center px-4 py-12 overflow-hidden" data-testid="forgot-screen">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[40%] w-[500px] h-[500px] rounded-full bg-[#E8734A]/8 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[30%] w-[350px] h-[350px] rounded-full bg-[#FF9F7C]/5 blur-[110px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <Logo />
          <span className="text-[15px] font-bold tracking-tight text-white font-poppins">
            NewMom<span className="text-[#FF9F7C]">Circle</span>
          </span>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm">
          {successMsg ? (
            <div className="space-y-6" data-testid="forgot-password-success">
              {/* Success state */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#4CAF7D]/20 border border-[#4CAF7D]/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#4CAF7D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white font-poppins">Check your inbox</h2>
                <p className="text-sm text-white/50 leading-relaxed">{successMsg}</p>
              </div>

              <Link
                href="/auth/login"
                className="block text-center w-full py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-semibold text-white hover:bg-white/[0.09] transition-colors font-poppins"
                data-testid="forgot-back-to-login-btn"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1.5 mb-8">
                <h1 className="text-2xl font-bold text-white font-poppins tracking-tight">Reset your password</h1>
                <p className="text-sm text-white/45">Enter your email and we&apos;ll send a recovery link</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block">Email Address</label>
                  <GlassInput
                    placeholder="you@example.com"
                    type="email"
                    error={!!errors.email}
                    data-testid="forgot-password-email-input"
                    {...register('email')}
                    leftIcon={<MailIcon />}
                  />
                  {errors.email && (
                    <p className="text-[#E85555] text-xs font-medium pl-0.5" data-testid="forgot-password-error">{errors.email.message}</p>
                  )}
                </div>

                <PeachButton type="submit" loading={isLoading} className="w-full !h-12 font-semibold text-sm mt-1" data-testid="forgot-password-submit-btn">
                  {!isLoading && "Send Recovery Link"}
                </PeachButton>

                <p className="text-center text-sm text-white/40">
                  Remember your password?{' '}
                  <Link href="/auth/login" className="text-[#FF9F7C] font-semibold hover:text-[#FFCFBB] transition-colors" data-testid="forgot-password-back-link">
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </motion.div>

      <Toast message={errorToast} type="error" onClose={() => setErrorToast(null)} />
    </div>
  );
}
