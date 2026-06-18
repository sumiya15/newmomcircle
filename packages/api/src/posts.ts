import type { AppSupabaseClient } from './client';
import type { Post } from '@newmomcircle/types';

function toPost(row: Record<string, unknown>): Post {
  return {
    id: row['id'] as string,
    authorId: row['author_id'] as string,
    authorName: row['author_name'] as string,
    authorInitials: row['author_initials'] as string,
    authorPhotoUrl: row['author_photo_url'] as string | null,
    content: row['content'] as string,
    imageUrl: row['image_url'] as string | null,
    likeCount: row['like_count'] as number,
    commentCount: row['comment_count'] as number,
    likedBy: (row['liked_by'] as string[]) ?? [],
    isAnonymous: row['is_anonymous'] as boolean,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

export async function getPosts(
  supabase: AppSupabaseClient,
  limit = 30
): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(toPost);
}

export function subscribeToPostsRealtime(
  supabase: AppSupabaseClient,
  onUpdate: (posts: Post[]) => void
) {
  const channel = supabase
    .channel('posts-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, async () => {
      const posts = await getPosts(supabase);
      onUpdate(posts);
    })
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}

export async function createPost(
  supabase: AppSupabaseClient,
  data: { authorId: string; authorName: string; authorInitials: string; authorPhotoUrl?: string; content: string; imageUrl?: string; isAnonymous?: boolean }
): Promise<Post | null> {
  const { data: row, error } = await supabase
    .from('posts')
    .insert({
      author_id: data.authorId,
      author_name: data.isAnonymous ? 'Anonymous Mom' : data.authorName,
      author_initials: data.isAnonymous ? 'AM' : data.authorInitials,
      author_photo_url: data.isAnonymous ? null : (data.authorPhotoUrl ?? null),
      content: data.content,
      image_url: data.imageUrl ?? null,
      is_anonymous: data.isAnonymous ?? false,
    })
    .select()
    .single();
  if (error || !row) return null;
  return toPost(row as Record<string, unknown>);
}

export async function toggleLike(
  supabase: AppSupabaseClient,
  postId: string,
  userId: string,
  currentLikedBy: string[]
): Promise<void> {
  const hasLiked = currentLikedBy.includes(userId);
  const liked_by = hasLiked
    ? currentLikedBy.filter((id) => id !== userId)
    : [...currentLikedBy, userId];
  await supabase
    .from('posts')
    .update({ liked_by, like_count: liked_by.length })
    .eq('id', postId);
}

export async function deletePost(supabase: AppSupabaseClient, postId: string): Promise<void> {
  await supabase.from('posts').delete().eq('id', postId);
}
