"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';
import { supabase } from '@/lib/supabase';
import {
  getPosts,
  createPost,
  toggleLike,
  deletePost,
  subscribeToPostsRealtime,
  addComment,
} from '@newmomcircle/api';
import type { Post, Comment } from '@newmomcircle/types';

// ─── DUMMY POSTS (always visible when offline or feed is sparse) ──────────────
const DUMMY_POSTS: Post[] = [
  { id: 'd1', authorId: 'user-priya', authorName: 'Priya Sharma', authorInitials: 'PS', content: 'Day 15 postpartum. Finally managed a shower AND made chai. Small wins count! 🌸', likeCount: 24, likedBy: [], commentCount: 8, createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(), isAnonymous: false },
  { id: 'd2', authorId: 'user-anita', authorName: 'Anita Reddy', authorInitials: 'AR', content: 'मेरे बच्चे ने आज पहली बार मुस्कुराया! यह पल जिंदगी भर याद रहेगा 💕', likeCount: 47, likedBy: [], commentCount: 15, createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(), isAnonymous: false },
  { id: 'd3', authorId: 'user-kavitha', authorName: 'Kavitha S', authorInitials: 'KS', content: 'The breathing exercises in the Toolbox actually helped with my anxiety today. Highly recommend to all new moms here! 🙏', likeCount: 31, likedBy: [], commentCount: 12, createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(), isAnonymous: false },
  { id: 'd4', authorId: 'user-meena', authorName: 'Meena Iyer', authorInitials: 'MI', content: 'నా పాప 1 నెల పూర్తి చేసింది! ఈ journey లో మీ support చాలా help అయింది. Thank you NewMomCircle family! 🌺', likeCount: 52, likedBy: [], commentCount: 20, createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(), isAnonymous: false },
  { id: 'd5', authorId: 'user-sunita', authorName: 'Sunita Patel', authorInitials: 'SP', content: 'Breastfeeding struggles are REAL. Anyone else going through this? Need some support 💙', likeCount: 89, likedBy: [], commentCount: 34, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), isAnonymous: false },
  { id: 'd6', authorId: 'user-lakshmi', authorName: 'Lakshmi N', authorInitials: 'LN', content: 'Sleep deprivation is a form of torture but these little faces make it worth it 😭❤️ Week 3 survivors unite!', likeCount: 126, likedBy: [], commentCount: 45, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), isAnonymous: false },
  { id: 'd7', authorId: 'user-fatima', authorName: 'Fatima Khan', authorInitials: 'FK', content: 'என் குழந்தைக்கு காய்ச்சல் வந்தது, பயமாக இருந்தது. இப்போது நன்றாக இருக்கிறது 🤲', likeCount: 38, likedBy: [], commentCount: 16, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), isAnonymous: false },
  { id: 'd8', authorId: 'user-deepa', authorName: 'Deepa Menon', authorInitials: 'DM', content: 'Just used the SOS feature for the first time. My anxiety spiral was real. The response from my guardian was instant. This app literally saved me tonight. 💜', likeCount: 203, likedBy: [], commentCount: 67, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), isAnonymous: false },
];

const TRENDING_TOPICS = [
  '#PostpartumRecovery', '#NewMomIndia', '#BreastfeedingSupport',
  '#SleepDeprivation', '#BabyMilestones', '#MentalHealthMatters',
  '#MomLifeIndia', '#NewbornCare', '#PostpartumAnxiety', '#SelfCareForMoms'
];

const MOCK_COMMENTS: Record<string, Comment[]> = {
  'd1': [{ id: 'comment-d1a', postId: 'd1', authorId: 'user-kavitha', authorName: 'Kavitha S.', authorInitials: 'KS', content: 'Small wins are EVERYTHING! You go mama! 🎉', createdAt: new Date(Date.now() - 3600000).toISOString() }],
  'd5': [{ id: 'comment-d5a', postId: 'd5', authorId: 'user-lakshmi', authorName: 'Lakshmi N.', authorInitials: 'LN', content: 'You are not alone! It does get better. Try a lactation consultant — mine was a game changer.', createdAt: new Date().toISOString() }],
};

export default function FeedPage() {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [postContent, setPostContent] = useState('');
  const [postLanguage, setPostLanguage] = useState<'en' | 'hi' | 'te' | 'ta' | 'kn'>('en');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postImageUrl, setPostImageUrl] = useState('');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(3);
  const [visibleCount, setVisibleCount] = useState(5);

  const mergeWithDummy = useCallback((real: Post[]) => {
    const realIds = new Set(real.map(p => p.id));
    const fill = DUMMY_POSTS.filter(dp => !realIds.has(dp.id));
    return real.length < 8 ? [...real, ...fill.slice(0, 8 - real.length)] : real;
  }, []);

  useEffect(() => {
    const offline = !process.env.NEXT_PUBLIC_SUPABASE_URL;
    setIsOfflineMode(offline);

    if (offline) {
      const saved = localStorage.getItem('newmomcircle_mock_posts');
      if (saved) {
        const parsed = JSON.parse(saved) as Post[];
        setPosts(mergeWithDummy(parsed));
      } else {
        setPosts(DUMMY_POSTS);
        localStorage.setItem('newmomcircle_mock_posts', JSON.stringify(DUMMY_POSTS));
      }
      const savedComments = localStorage.getItem('newmomcircle_mock_comments');
      setComments(savedComments ? { ...MOCK_COMMENTS, ...JSON.parse(savedComments) } : MOCK_COMMENTS);
    } else {
      void getPosts(supabase, 20).then(real => setPosts(mergeWithDummy(real)));
      const unsub = subscribeToPostsRealtime(supabase, real => setPosts(mergeWithDummy(real)));
      return unsub;
    }
  }, [mergeWithDummy]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !user || !userProfile) return;
    setIsSubmitting(true);

    const displayName = isAnonymous ? 'Anonymous Mom' : userProfile.displayName;
    const initials = isAnonymous
      ? 'AM'
      : userProfile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (isOfflineMode) {
      const newMockPost: Post = {
        id: `mock-post-${Date.now()}`,
        authorId: isAnonymous ? `anon_${user.id}` : user.id,
        authorName: displayName,
        authorInitials: initials,
        content: postContent,
        imageUrl: postImageUrl.trim() || null,
        likeCount: 0,
        likedBy: [],
        commentCount: 0,
        isAnonymous,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedPosts = [newMockPost, ...posts];
      setPosts(updatedPosts);
      localStorage.setItem('newmomcircle_mock_posts', JSON.stringify(updatedPosts));
      setComments(prev => {
        const next = { ...prev, [newMockPost.id]: [] };
        localStorage.setItem('newmomcircle_mock_comments', JSON.stringify(next));
        return next;
      });
    } else {
      const created = await createPost(supabase, {
        authorId: isAnonymous ? `anon_${user.id}` : user.id,
        authorName: displayName,
        authorInitials: initials,
        content: postContent,
        imageUrl: postImageUrl.trim() || undefined,
        isAnonymous,
      });
      if (created) setPosts(prev => [created, ...prev]);
    }

    setPostContent('');
    setPostImageUrl('');
    setIsAnonymous(false);
    setIsSubmitting(false);
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likedBy.includes(user.id);
    const likedBy = isLiked ? post.likedBy.filter(id => id !== user.id) : [...post.likedBy, user.id];

    if (isOfflineMode) {
      const updated = posts.map(p => p.id === postId ? { ...p, likedBy, likeCount: likedBy.length } : p);
      setPosts(updated);
      localStorage.setItem('newmomcircle_mock_posts', JSON.stringify(updated));
    } else {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedBy, likeCount: likedBy.length } : p));
      await toggleLike(supabase, postId, user.id, post.likedBy);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = newComments[postId];
    if (!text?.trim() || !user || !userProfile) return;
    const initials = userProfile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (isOfflineMode) {
      const mockComment: Comment = {
        id: `mock-comment-${Date.now()}`,
        postId,
        authorId: user.id,
        authorName: userProfile.displayName,
        authorInitials: initials,
        content: text,
        createdAt: new Date().toISOString(),
      };
      const updated = { ...comments, [postId]: [...(comments[postId] || []), mockComment] };
      setComments(updated);
      localStorage.setItem('newmomcircle_mock_comments', JSON.stringify(updated));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
    } else {
      const created = await addComment(supabase, {
        postId,
        authorId: user.id,
        authorName: userProfile.displayName,
        authorInitials: initials,
        content: text,
      });
      if (created) {
        setComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), created] }));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
      }
    }
    setNewComments(prev => ({ ...prev, [postId]: '' }));
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    if (isOfflineMode) {
      const updatedPosts = posts.filter(p => p.id !== postId);
      setPosts(updatedPosts);
      localStorage.setItem('newmomcircle_mock_posts', JSON.stringify(updatedPosts));
      setComments(prev => { const next = { ...prev }; delete next[postId]; return next; });
    } else {
      await deletePost(supabase, postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const getPostDateLabel = (post: Post) => {
    const date = new Date(post.createdAt);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins <= 0 ? 'Just now' : `${diffMins} minutes ago`;
    }
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <div className="max-w-3xl mx-auto space-y-5 w-full pb-10" data-testid="feed-screen">
        {/* Page header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">Community Circle</h1>
            <p className="text-[13px] text-white/40 mt-0.5">Connect with mothers in your language</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (document.querySelector<HTMLTextAreaElement>('[data-testid="create-post-input"]'))?.focus()}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#FF9F7C]/10 border border-[#FF9F7C]/20 text-[#FF9F7C] hover:bg-[#FF9F7C]/20 transition-colors"
              data-testid="feed-create-btn"
            >
              + New Post
            </button>
            <button
              onClick={() => setNotificationsCount(0)}
              className="relative p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/8 text-white/60 hover:text-white transition-all"
              data-testid="feed-notification-btn"
            >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#E85555] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notificationsCount}
              </span>
            )}
            </button>
          </div>
        </div>

        {/* Trending Topics Marquee */}
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
          <div className="py-3 flex items-center">
            <span className="text-xs font-bold text-[#FF9F7C] px-4 flex-shrink-0 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#FF9F7C" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Trending
            </span>
            <div className="overflow-hidden flex-1">
              <div className="flex animate-marquee whitespace-nowrap">
                {[...TRENDING_TOPICS, ...TRENDING_TOPICS].map((topic, i) => (
                  <span
                    key={i}
                    className="inline-block px-3 py-1 mx-1.5 rounded-full bg-[#FF9F7C]/15 border border-[#FF9F7C]/20 text-[11px] font-semibold text-white/90 whitespace-nowrap cursor-pointer hover:bg-[#FF9F7C]/25 transition-colors"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Create Post Card */}
        {userProfile && (
          <GlassCard className="p-6 space-y-4">
            <form onSubmit={handleCreatePost} className="space-y-4" data-testid="feed-create-form">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FF9F7C] text-[#2D1B13] font-bold flex items-center justify-center text-sm font-poppins flex-shrink-0">
                  {isAnonymous ? 'AM' : userProfile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-grow">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder={`What's on your mind, ${isAnonymous ? 'Anonymous Mom' : userProfile.displayName.split(' ')[0]}?`}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#FF9F7C]/60 focus:bg-white/[0.06] transition-all resize-none text-[13.5px] font-inter h-[88px] leading-relaxed"
                    required
                    data-testid="create-post-input"
                  />
                </div>
              </div>

              {/* Optional Image URL Input */}
              <div className="flex items-center gap-2 pl-14">
                <span className="text-xs text-white/50">🔗 Image URL (Optional):</span>
                <input
                  type="url"
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-grow bg-white/5 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF9F7C] transition-colors"
                />
              </div>

              {/* Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 pl-14">
                <div className="flex items-center gap-4">
                  <select
                    value={postLanguage}
                    onChange={(e) => setPostLanguage(e.target.value as 'en' | 'hi' | 'te' | 'ta' | 'kn')}
                    className="bg-white/5 border border-white/20 rounded-lg text-xs text-white py-1.5 px-3 focus:outline-none focus:border-[#FF9F7C] cursor-pointer"
                  >
                    <option value="en" className="bg-[#140804] text-white">🇬🇧 English</option>
                    <option value="hi" className="bg-[#140804] text-white">🇮🇳 Hindi</option>
                    <option value="te" className="bg-[#140804] text-white">Telugu</option>
                    <option value="ta" className="bg-[#140804] text-white">Tamil</option>
                    <option value="kn" className="bg-[#140804] text-white">Kannada</option>
                  </select>

                  <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded text-[#FF9F7C] bg-white/5 border-white/20 accent-[#FF9F7C] cursor-pointer"
                    />
                    <span>Post Anonymously</span>
                  </label>
                </div>

                <PeachButton type="submit" loading={isSubmitting} disabled={!postContent.trim()} className="!px-6 !py-2 text-sm !font-semibold" data-testid="create-post-submit-btn">
                  Post
                </PeachButton>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Feed List */}
        <div className="space-y-6" data-testid="feed-list">
          {visiblePosts.length === 0 ? (
            <GlassCard className="p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#FF9F7C]/10 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
              </div>
              <h3 className="text-xl font-bold text-[#FFCFBB] font-poppins">No posts yet</h3>
              <p className="text-sm text-white/60">Be the first to share something with the community today.</p>
            </GlassCard>
          ) : (
            visiblePosts.map((post, index) => {
              const hasLiked = user && post.likedBy.includes(user.id);
              const postComments = comments[post.id] || [];
              const isCommentsOpen = expandedComments[post.id];

              return (
                <div
                  key={post.id}
                  className="animate-post-appear"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <GlassCard className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FF9F7C]/20 border border-[#FF9F7C]/40 text-[#FF9F7C] font-bold flex items-center justify-center text-sm font-poppins">
                          {post.authorInitials}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white font-poppins flex items-center gap-2">
                            {post.authorName}
                            {post.isAnonymous && (
                              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60 font-normal">Anon</span>
                            )}
                          </h4>
                          <p className="text-[10px] text-white/50">{getPostDateLabel(post)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {userProfile?.role === 'admin' && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-white/40 hover:text-[#D94F4F] transition-colors p-1.5 rounded-lg hover:bg-white/5"
                            title="Delete Post"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-poppins pl-1">
                      {post.content}
                    </p>

                    {/* Optional Image */}
                    {post.imageUrl && (
                      <div className="w-full max-h-[320px] rounded-2xl overflow-hidden border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.imageUrl}
                          className="w-full h-full object-cover"
                          alt="Post attachment"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center gap-6 border-t border-b border-white/10 py-3 text-xs pl-1 select-none">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          hasLiked ? 'text-[#FF9F7C] font-bold' : 'text-white/60 hover:text-[#FF9F7C]'
                        }`}
                        data-testid={`feed-like-${post.id}-btn`}
                      >
                        <span>{hasLiked ? '❤️' : '♡'}</span>
                        <span>{post.likeCount}</span>
                      </button>

                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 text-white/60 hover:text-[#FF9F7C] transition-colors"
                        data-testid={`feed-comments-${post.id}-btn`}
                      >
                        <span>💬</span>
                        <span>{post.commentCount} Comments</span>
                      </button>
                    </div>

                    {/* Comments Accordion */}
                    {isCommentsOpen && (
                      <div className="space-y-4 pt-2 animate-fade-slide-up">
                        <div className="space-y-3">
                          {postComments.length === 0 ? (
                            <p className="text-xs text-white/40 italic py-2 pl-2">No comments yet. Write one below!</p>
                          ) : (
                            postComments.map((comment) => (
                              <div key={comment.id} className="flex gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                                <div className="w-7 h-7 rounded-full bg-[#E8734A]/20 border border-[#E8734A]/40 text-[#E8734A] font-bold flex items-center justify-center text-[10px] font-poppins flex-shrink-0">
                                  {comment.authorInitials}
                                </div>
                                <div className="flex-grow space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white font-poppins">{comment.authorName}</span>
                                    <span className="text-[9px] text-white/40">
                                      {new Date(comment.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/70 leading-relaxed font-poppins">{comment.content}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComments[post.id] || ''}
                            onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') void handleAddComment(post.id); }}
                            className="glass-input !py-2.5 !text-xs"
                            data-testid={`feed-comment-input-${post.id}`}
                          />
                          <PeachButton
                            onClick={() => void handleAddComment(post.id)}
                            className="!px-4 !py-2.5 !rounded-xl !h-[38px] flex-shrink-0"
                            data-testid={`feed-comment-submit-${post.id}-btn`}
                          >
                            <svg className="w-4 h-4 text-white fill-current rotate-90" viewBox="0 0 24 24">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                          </PeachButton>
                        </div>
                      </div>
                    )}
                  </GlassCard>
                </div>
              );
            })
          )}
        </div>

        {/* Load More / End of Feed */}
        {hasMore ? (
          <div className="text-center pt-4">
            <button
              onClick={() => setVisibleCount(prev => prev + 5)}
              className="btn-secondary !text-xs !px-6 !py-3 cursor-pointer"
            >
              Load more ↓
            </button>
          </div>
        ) : posts.length > 0 ? (
          <div className="text-center pt-4">
            <p className="text-xs text-white/40">You&apos;ve reached the end of the feed</p>
          </div>
        ) : null}
    </div>
  );
}
