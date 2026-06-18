/**
 * supabase/db.ts
 * Pre-binds the Supabase client to all API functions.
 * Screens import from here without needing to pass the client on every call.
 */

import { supabase } from './client';
import * as api from '@newmomcircle/api';

// ─── Profiles ────────────────────────────────────────────────────────────────
export const getUserProfile = (userId: string) => api.getProfile(supabase, userId);
export const updateUserProfile = (userId: string, updates: Parameters<typeof api.updateProfile>[2]) =>
  api.updateProfile(supabase, userId, updates);

// ─── Posts ───────────────────────────────────────────────────────────────────
export const getPosts = (limit?: number) => api.getPosts(supabase, limit);
export const subscribeToPostsRealtime = (onUpdate: Parameters<typeof api.subscribeToPostsRealtime>[1]) =>
  api.subscribeToPostsRealtime(supabase, onUpdate);
export const createPost = (data: Parameters<typeof api.createPost>[1]) =>
  api.createPost(supabase, data);
export const toggleLike = (postId: string, userId: string, currentLikedBy: string[]) =>
  api.toggleLike(supabase, postId, userId, currentLikedBy);
export const deletePost = (postId: string) => api.deletePost(supabase, postId);

// ─── Comments ────────────────────────────────────────────────────────────────
export const getComments = (postId: string) => api.getComments(supabase, postId);
export const subscribeToComments = (postId: string, onUpdate: Parameters<typeof api.subscribeToComments>[2]) =>
  api.subscribeToComments(supabase, postId, onUpdate);
export const addComment = (data: Parameters<typeof api.addComment>[1]) =>
  api.addComment(supabase, data);
export const deleteComment = (commentId: string) => api.deleteComment(supabase, commentId);

// ─── Journal ─────────────────────────────────────────────────────────────────
export const createJournalEntry = (data: Parameters<typeof api.createJournalEntry>[1]) =>
  api.createJournalEntry(supabase, data);
export const updateJournalSentiment = (entryId: string, sentiment: Parameters<typeof api.updateJournalSentiment>[2]) =>
  api.updateJournalSentiment(supabase, entryId, sentiment);
export const getJournalEntries = (userId: string, limit?: number) =>
  api.getJournalEntries(supabase, userId, limit);

// ─── Guardians ───────────────────────────────────────────────────────────────
export const getGuardians = (userId: string) => api.getGuardians(supabase, userId);
export const addGuardian = (data: Parameters<typeof api.addGuardian>[1]) =>
  api.addGuardian(supabase, data);
export const deleteGuardian = (guardianId: string) => api.deleteGuardian(supabase, guardianId);

// ─── Resources ───────────────────────────────────────────────────────────────
export const getApprovedResources = (lang?: Parameters<typeof api.getApprovedResources>[1]) =>
  api.getApprovedResources(supabase, lang);
export const getPendingResources = () => api.getPendingResources(supabase);
export const submitResource = (data: Parameters<typeof api.submitResource>[1]) =>
  api.submitResource(supabase, data);
export const approveResource = (resourceId: string) => api.approveResource(supabase, resourceId);

// ─── SOS ─────────────────────────────────────────────────────────────────────
export const sendSosAlert = (userId: string, method?: 'button' | 'shake') =>
  api.sendSosAlert(supabase, userId, method);

// ─── AI Functions ─────────────────────────────────────────────────────────────
export const analyzeSentiment = (text: string) => api.analyzeSentiment(supabase, text);
export const generateInsightSummary = (weekData: Parameters<typeof api.generateInsightSummary>[1]) =>
  api.generateInsightSummary(supabase, weekData);

// Re-export types used by screens
export type { Post, Comment, JournalEntry, Guardian, Resource } from '@newmomcircle/types';
