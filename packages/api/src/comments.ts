import type { AppSupabaseClient } from './client';
import type { Comment } from '@newmomcircle/types';

function toComment(row: Record<string, unknown>): Comment {
  return {
    id: row['id'] as string,
    postId: row['post_id'] as string,
    authorId: row['author_id'] as string,
    authorName: row['author_name'] as string,
    authorInitials: row['author_initials'] as string,
    content: row['content'] as string,
    createdAt: row['created_at'] as string,
  };
}

export async function getComments(
  supabase: AppSupabaseClient,
  postId: string
): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(toComment);
}

export function subscribeToComments(
  supabase: AppSupabaseClient,
  postId: string,
  onUpdate: (comments: Comment[]) => void
) {
  const channel = supabase
    .channel(`comments-${postId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, async () => {
      const comments = await getComments(supabase, postId);
      onUpdate(comments);
    })
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}

export async function addComment(
  supabase: AppSupabaseClient,
  data: { postId: string; authorId: string; authorName: string; authorInitials: string; content: string }
): Promise<Comment | null> {
  const { data: row, error } = await supabase
    .from('comments')
    .insert({
      post_id: data.postId,
      author_id: data.authorId,
      author_name: data.authorName,
      author_initials: data.authorInitials,
      content: data.content,
    })
    .select()
    .single();
  if (error || !row) return null;
  // Increment comment_count on the parent post directly
  const { data: post } = await supabase.from('posts').select('comment_count').eq('id', data.postId).single();
  if (post) {
    await supabase.from('posts').update({ comment_count: ((post as { comment_count: number }).comment_count ?? 0) + 1 }).eq('id', data.postId);
  }
  return toComment(row as Record<string, unknown>);
}

export async function deleteComment(supabase: AppSupabaseClient, commentId: string): Promise<void> {
  await supabase.from('comments').delete().eq('id', commentId);
}
