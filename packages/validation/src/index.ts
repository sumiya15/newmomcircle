import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const signupSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
    displayName: z.string().min(2, { message: 'Name must be at least 2 characters' }).max(50),
    babyDob: z.string().optional(),
    language: z.enum(['en', 'hi', 'te', 'ta', 'kn']).default('en'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

// ─── Post ─────────────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Post cannot be empty' })
    .max(2000, { message: 'Post cannot exceed 2000 characters' }),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isAnonymous: z.boolean().default(false),
});

// ─── Comment ──────────────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Comment cannot be empty' })
    .max(500, { message: 'Comment cannot exceed 500 characters' }),
});

// ─── Journal ──────────────────────────────────────────────────────────────────

export const createJournalSchema = z.object({
  content: z
    .string()
    .min(10, { message: 'Entry must be at least 10 characters' })
    .max(5000, { message: 'Entry cannot exceed 5000 characters' }),
  mood: z.enum(['very_low', 'low', 'neutral', 'good', 'great']).optional(),
  allowRetraining: z.boolean().default(false),
});

// ─── Guardian ─────────────────────────────────────────────────────────────────

export const guardianSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).max(100),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, { message: 'Enter a valid phone number (e.g. +91XXXXXXXXXX)' }),
  relationship: z.string().min(2).max(50),
});

// ─── Resource ─────────────────────────────────────────────────────────────────

export const resourceSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(50).max(10000),
  category: z.string().min(2).max(50),
  language: z.enum(['en', 'hi', 'te', 'ta', 'kn']),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

// ─── Profile update ───────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  babyDob: z.string().optional(),
  language: z.enum(['en', 'hi', 'te', 'ta', 'kn']).optional(),
  allowRetraining: z.boolean().optional(),
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateJournalInput = z.infer<typeof createJournalSchema>;
export type GuardianInput = z.infer<typeof guardianSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
