// ─── Primitives ──────────────────────────────────────────────────────────────

export type SupportedLocale = 'en' | 'hi' | 'te' | 'ta' | 'kn';
export type UserRole = 'member' | 'volunteer' | 'admin';
export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type MoodLevel = 'very_low' | 'low' | 'neutral' | 'good' | 'great';
export type SosMethod = 'button' | 'shake';
export type SosStatus = 'sent' | 'mocked' | 'failed';
export type ResourceStatus = 'pending' | 'approved';
export type MentorRequestStatus = 'pending' | 'connected' | 'closed';
export type ToolboxStatus = 'pending' | 'in_progress' | 'completed';

// ─── Core entities ────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string | null;
  babyDob?: string | null;
  language: SupportedLocale;
  role: UserRole;
  allowRetraining: boolean;
  gdprDeleteRequested: boolean;
  gdprRequestedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorPhotoUrl?: string | null;
  content: string;
  imageUrl?: string | null;
  likeCount: number;
  commentCount: number;
  likedBy: string[];
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  content: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  mood?: MoodLevel | null;
  wordCount: number;
  language: string;
  sentiment?: SentimentLabel | null;
  sentimentScore?: number | null;
  sentimentAdvice?: string | null;
  suggestedCoping?: string | null;
  allowRetraining: boolean;
  analyzedAt?: string | null;
  createdAt: string;
}

export interface Guardian {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  category: string;
  language: SupportedLocale;
  submittedBy: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SosEvent {
  id: string;
  userId: string;
  triggeredAt: string;
  recipientCount: number;
  method: SosMethod;
  status: SosStatus;
}

export interface ToolboxProgress {
  id: string;
  userId: string;
  toolboxId: string;
  status: ToolboxStatus;
  completedAt?: string | null;
  lastUpdated: string;
}

export interface MentorRequest {
  id: string;
  userId: string;
  name: string;
  phone: string;
  message: string;
  status: MentorRequestStatus;
  mentorId?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: { message: string; code?: string };
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;
