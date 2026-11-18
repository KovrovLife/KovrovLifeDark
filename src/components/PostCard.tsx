'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react';

export interface CommentItem {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface PostItem {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  likesCount: number;
  isLiked: boolean;
  comments: CommentItem[];
}

interface PostCardProps {
  post: PostItem;
  currentUserId: string;
  onDelete: (postId: string) => void;
  onSelectUser?: (userId: string) => void;
}

export default function PostCard({ post, currentUserId, onDelete, onSelectUser }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [comments, setComments] = useState<CommentItem[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
      } else {
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || sendingComment) return;

    setSendingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setCommentText('');
      }
    } finally {
      setSendingComment(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) onDelete(post.id);
    } finally {
      setDeleting(false);
    }
  };

  const formattedDate = new Date(post.createdAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <article className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 sm:p-5 transition hover:border-zinc-700/80">
      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          type="button"
          onClick={() => onSelectUser?.(post.author.id)}
          className="flex items-center gap-3 min-w-0 text-left group"
        >
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt={post.author.name}
              className="w-11 h-11 rounded-full object-cover border border-zinc-700 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-base shrink-0">
              {post.author.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="font-semibold text-white group-hover:text-violet-400 text-sm sm:text-base truncate transition">
              {post.author.name}
            </p>
            <p className="text-xs text-zinc-400 truncate">
              @{post.author.username} · {formattedDate}
            </p>
          </div>
        </button>

        {post.author.id === currentUserId && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Удалить пост"
            className="p-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {post.content && (
        <p className="text-zinc-100 text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed mb-3">
          {post.content}
        </p>
      )}

      {post.imageUrl && (
        <div className="mb-3 rounded-2xl overflow-hidden border border-zinc-800 bg-[#0a0a0a]">
          <img src={post.imageUrl} alt="Изображение поста" className="w-full max-h-[460px] object-cover" loading="lazy" />
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/70">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition ${
            isLiked
              ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
              : 'bg-[#0a0a0a] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition ${
            showComments
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'bg-[#0a0a0a] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-3 border-t border-zinc-800/70 space-y-3">
          {comments.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-2">Пока нет комментариев. Будьте первым!</p>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl p-3 text-sm">
                  <button
                    type="button"
                    onClick={() => onSelectUser?.(c.user.id)}
                    className="font-medium text-zinc-200 hover:text-violet-400 text-xs mb-1 block text-left"
                  >
                    {c.user.name} <span className="text-zinc-500">@{c.user.username}</span>
                  </button>
                  <p className="text-zinc-300 text-xs sm:text-sm break-words">{c.text}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Написать комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 h-11 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || sendingComment}
              className="w-11 h-11 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
