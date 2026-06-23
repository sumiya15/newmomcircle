"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import { GlassInput } from '@/components/ui/GlassInput';
import { PeachButton } from '@/components/ui/PeachButton';
import { Toast } from '@/components/ui/Toast';

const LANGUAGES = ['en', 'hi', 'te', 'ta', 'kn'] as const;

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
  babyDate: z.string().min(1, { message: 'Please enter a date' }),
  language: z.enum(LANGUAGES, { message: 'Please select a language' }),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the Terms and Privacy Policy',
  }),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
) : (
  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Logo = () => (
  <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#FF9F7C" opacity="0.15"/>
    <circle cx="20" cy="11" r="3.5" fill="#FF9F7C"/>
    <circle cx="25" cy="17" r="2.5" fill="#FFCFBB"/>
    <path d="M14 28 Q14 20 20 18 Q24 16 26 20 Q28 24 24 26 Q20 28 14 28Z" fill="#FF9F7C" opacity="0.85"/>
  </svg>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[11.5px] font-semibold text-white/50 uppercase tracking-wide font-poppins">{children}</label>
);

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? <p className="text-[#FF8585] text-[11.5px] font-medium pl-0.5 mt-0.5">{msg}</p> : null;

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { acceptTerms: false },
  });

  const pwdWatch = watch('password', '');
  const cpwdWatch = watch('confirmPassword', '');
  const livePasswordMismatch = cpwdWatch.length > 0 && pwdWatch !== cpwdWatch;

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await signUp(data.email, data.password, data.fullName, data.babyDate, data.language);
      router.push('/onboarding');
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === 'email_confirmation_required') {
        setSuccessMsg('Account created! Check your email for a confirmation link, then sign in.');
        return;
      }
      const msg = (e?.message ?? '').toLowerCase();
      let errMsg = 'Registration failed. Please check your details and try again.';
      if (msg.includes('already registered') || msg.includes('already been used') || msg.includes('already in use')) {
        errMsg = 'This email is already registered. Try signing in instead.';
      } else if (msg.includes('weak') || msg.includes('6 characters')) {
        errMsg = 'Password is too weak — use at least 6 characters.';
      } else if (msg.includes('network') || msg.includes('fetch')) {
        errMsg = 'Network error. Check your connection and try again.';
      }
      setErrorMsg(errMsg);
      setTimeout(() => setErrorMsg(null), 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      router.push('/onboarding');
    } catch {
      setErrorMsg('Google authentication failed. Please try again.');
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0E0705] flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] right-[25%] w-[500px] h-[500px] rounded-full bg-[#E8734A]/8 blur-[130px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-[#FF9F7C]/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[460px]"
        data-testid="signup-screen"
      >
        <div className="bg-white/[0.05] border border-white/10 rounded-[24px] p-8 backdrop-blur-xl shadow-2xl">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="mb-4">
              <Logo />
            </div>
            <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">
              Join NewMomCircle
            </h1>
            <p className="text-[13px] text-white/45 mt-1">
              Your private, safe space begins here
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate data-testid="signup-form">

            {/* Full Name */}
            <div className="space-y-1.5">
              <FieldLabel>Full name</FieldLabel>
              <GlassInput
                placeholder="Priya Sharma"
                type="text"
                error={!!errors.fullName}
                autoComplete="name"
                data-testid="signup-name-input"
                {...register('fullName')}
                leftIcon={
                  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <FieldError msg={errors.fullName?.message} />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <FieldLabel>Email address</FieldLabel>
              <GlassInput
                placeholder="priya@example.com"
                type="email"
                error={!!errors.email}
                autoComplete="email"
                data-testid="signup-email-input"
                {...register('email')}
                leftIcon={
                  <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <FieldError msg={errors.email?.message} />
            </div>

            {/* Password row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel>Password</FieldLabel>
                <GlassInput
                  placeholder="Min. 6 chars"
                  type={showPassword ? 'text' : 'password'}
                  error={!!errors.password}
                  autoComplete="new-password"
                  data-testid="signup-password-input"
                  {...register('password')}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/35 hover:text-white/70 transition-colors" tabIndex={-1}>
                      <EyeIcon open={showPassword} />
                    </button>
                  }
                />
                <FieldError msg={errors.password?.message} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Confirm</FieldLabel>
                <GlassInput
                  placeholder="Repeat"
                  type={showConfirmPassword ? 'text' : 'password'}
                  error={!!errors.confirmPassword}
                  autoComplete="new-password"
                  data-testid="signup-confirm-input"
                  {...register('confirmPassword')}
                  rightIcon={
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-white/35 hover:text-white/70 transition-colors" tabIndex={-1}>
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  }
                />
                <FieldError msg={errors.confirmPassword?.message} />
              </div>
            </div>

            {/* Baby date + Language row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel>Baby due / born</FieldLabel>
                <GlassInput
                  type="date"
                  error={!!errors.babyDate}
                  {...register('babyDate')}
                  leftIcon={
                    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <FieldError msg={errors.babyDate?.message} />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Language</FieldLabel>
                <select
                  {...register('language')}
                  className={`glass-input appearance-none cursor-pointer ${errors.language ? 'error' : ''}`}
                >
                  <option value="" className="bg-[#140804] text-white/50">Select…</option>
                  <option value="en" className="bg-[#140804] text-white">English</option>
                  <option value="hi" className="bg-[#140804] text-white">हिंदी</option>
                  <option value="te" className="bg-[#140804] text-white">తెలుగు</option>
                  <option value="ta" className="bg-[#140804] text-white">தமிழ்</option>
                  <option value="kn" className="bg-[#140804] text-white">ಕನ್ನಡ</option>
                </select>
                <FieldError msg={errors.language?.message} />
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="mt-0.5 w-[14px] h-[14px] rounded border-white/20 bg-white/10 accent-[#FF9F7C] cursor-pointer flex-shrink-0"
                />
                <span className="text-[12px] text-white/55 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-[#FF9F7C] hover:underline font-medium">Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-[#FF9F7C] hover:underline font-medium">Privacy Policy</Link>
                </span>
              </label>
              <FieldError msg={errors.acceptTerms?.message} />
            </div>

            {livePasswordMismatch ? (
              <p className="text-[#FF8585] text-[11.5px] text-center font-medium" data-testid="signup-error-message">
                Passwords do not match
              </p>
            ) : (errors.fullName || errors.email || errors.password || errors.babyDate || errors.language || errors.acceptTerms)?.message ? (
              <p className="text-[#FF8585] text-[11.5px] text-center font-medium" data-testid="signup-error-message">
                {String((errors.fullName || errors.email || errors.password || errors.babyDate || errors.language || errors.acceptTerms)?.message)}
              </p>
            ) : null}

            <PeachButton
              type="submit"
              loading={isLoading}
              className="w-full !h-[46px] !text-[14px] !font-semibold mt-1"
              data-testid="signup-submit-btn"
            >
              {!isLoading && 'Create Account'}
            </PeachButton>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[11px] font-medium text-white/30 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-[44px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/18 rounded-xl text-white flex items-center justify-center gap-2.5 transition-all duration-150 text-[13.5px] font-medium font-poppins disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="signup-google-btn"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[12.5px] text-white/40 mt-6">
            Already a member?{' '}
            <Link href="/auth/login" className="text-[#FF9F7C] hover:text-[#FFCFBB] font-semibold transition-colors" data-testid="signup-login-link">
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-white/25 mt-5">
          Your data is encrypted and HIPAA-aligned. We never sell your information.
        </p>
      </motion.div>

      <Toast message={successMsg} type="success" />
      <Toast message={errorMsg} type="error" onClose={() => setErrorMsg(null)} />
    </div>
  );
}
