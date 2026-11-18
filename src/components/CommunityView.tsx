'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Send, ImagePlus, Loader2 } from 'lucide-react';
import PostCard, { PostItem } from './PostCard';

export interface CommunityItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  ownerId: string;
  membersCount: number;
  isMember: boolean;
}

interface CommunityViewProps {
  community: CommunityItem;
  initialPosts: PostItem[];
  currentUserId: string;
  onBack: () => void;
  onToggleJoin: (communityId: string) => void;
  onSelectUser: (userId: string) => void;
}

export default function CommunityView({
  community,
  initialPosts,
  currentUserId,
  onBack,
  onToggleJoin,
  onSelectUser,
}: CommunityViewProps) {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!postText.trim() && !postImage) || posting) return;
    setPosting(true);

    try {
      const formData = new FormData();
      formData.append('content', postText);
      if (postImage) formData.append('image', postImage);

      const res = await fetch(`/api/communities/${community.id}`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => [data.post, ...prev]);
        setPostText('');
        setPostImage(null);
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#141414] border border-zinc-800 text-xs sm:text-sm text-zinc-300 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Все сообщества</span>
      </button>

      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {community.avatarUrl ? (
            <img
              src={community.avatarUrl}
              alt={community.name}
              className="w-16 h-16 rounded-2xl object-cover border border-zinc-700 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl shrink-0">
              {community.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{community.name}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{community.membersCount} участников</p>
            {community.description && (
              <p className="text-sm text-zinc-300 mt-1.5">{community.description}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => onToggleJoin(community.id)}
          className={`h-10 px-5 rounded-2xl text-xs sm:text-sm font-semibold transition ${
            community.isMember
              ? 'bg-[#0a0a0a] border border-zinc-700 text-zinc-300 hover:text-red-400'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {community.isMember ? 'Вы подписаны' : 'Подписаться'}
        </button>
      </div>

      {community.isMember && (
        <form
          onSubmit={handlePublish}
          className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 space-y-3"
        >
          <textarea
            rows={2}
            placeholder="Написать запись на стене сообщества..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="w-full bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none resize-none"
          />
          {postImage && <p className="text-xs text-cyan-400">Фото: {postImage.name}</p>}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/70">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-xs text-zinc-400 hover:text-cyan-400"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Фото</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setPostImage(e.target.files?.item(0) || null)}
              className="hidden"
            />
            <button
              type="submit"
              disabled={(!postText.trim() && !postImage) || posting}
              className="h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Опубликовать</span>
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-500 text-sm">
            В сообществе пока нет записей
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              onSelectUser={onSelectUser}
            />
          ))
        )}
      </div>
    </div>
  );
}
