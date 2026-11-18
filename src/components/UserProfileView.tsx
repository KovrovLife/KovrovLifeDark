'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  MessageSquare,
  MapPin,
  Loader2,
} from 'lucide-react';
import PostCard, { PostItem } from './PostCard';
import PhotosBlock from './PhotosBlock';

interface PublicUser {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  city: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  friendsCount: number;
  friendStatus: 'SELF' | 'NONE' | 'SENT' | 'RECEIVED' | 'FRIENDS';
}

interface UserProfileViewProps {
  userId: string;
  currentUserId: string;
  onBack: () => void;
  onOpenChat: (partner: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  }) => void;
  onSelectUser: (id: string) => void;
  onUpdateCounts: () => void;
}

export default function UserProfileView({
  userId,
  currentUserId,
  onBack,
  onOpenChat,
  onSelectUser,
  onUpdateCounts,
}: UserProfileViewProps) {
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarClickSignal, setAvatarClickSignal] = useState(0);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setPosts(data.posts);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleFriendAction = async () => {
    if (!profile) return;
    const res = await fetch(`/api/friends/${profile.id}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setProfile((prev) => (prev ? { ...prev, friendStatus: data.friendStatus } : null));
      onUpdateCounts();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-[#141414] border border-zinc-800 rounded-3xl p-8 text-center text-zinc-400">
        Пользователь не найден
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#141414] border border-zinc-800 text-xs sm:text-sm text-zinc-300 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад</span>
      </button>

      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl overflow-hidden">
        {profile.coverUrl ? (
          <img src={profile.coverUrl} alt="Обложка" className="w-full h-32 sm:h-40 object-cover" />
        ) : (
          <div className="h-28 bg-gradient-to-r from-violet-900/50 via-indigo-900/40 to-cyan-900/50 border-b border-zinc-800/60" />
        )}

        <div className="px-5 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-3 -mt-10 mb-4 relative z-10">
            {profile.avatarUrl ? (
              <button
                type="button"
                onClick={() => setAvatarClickSignal((s) => s + 1)}
                title="Открыть фотографию профиля"
                className="rounded-full focus:outline-none group"
              >
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-[#141414] group-hover:brightness-110 transition"
                />
              </button>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-[#141414]">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
            )}

            {profile.friendStatus !== 'SELF' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onOpenChat({
                      id: profile.id,
                      name: profile.name,
                      username: profile.username,
                      avatarUrl: profile.avatarUrl,
                    })
                  }
                  className="h-10 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-700 hover:border-cyan-500 text-cyan-400 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Сообщение</span>
                </button>

                {profile.friendStatus === 'NONE' && (
                  <button
                    onClick={handleFriendAction}
                    className="h-10 px-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>В друзья</span>
                  </button>
                )}

                {profile.friendStatus === 'SENT' && (
                  <button
                    onClick={handleFriendAction}
                    className="h-10 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-700 text-zinc-400 hover:text-red-400 text-xs sm:text-sm font-medium flex items-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Заявка отправлена</span>
                  </button>
                )}

                {profile.friendStatus === 'RECEIVED' && (
                  <button
                    onClick={handleFriendAction}
                    className="h-10 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Принять заявку</span>
                  </button>
                )}

                {profile.friendStatus === 'FRIENDS' && (
                  <button
                    onClick={handleFriendAction}
                    className="h-10 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-zinc-300 hover:text-red-400 text-xs sm:text-sm font-medium flex items-center gap-1.5"
                  >
                    <UserX className="w-4 h-4" />
                    <span>В друзьях</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-white">{profile.name}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
            <span>@{profile.username}</span>
            {profile.city && (
              <span className="flex items-center gap-1 text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {profile.city}
              </span>
            )}
            <span>· {profile.friendsCount} друзей</span>
          </div>

          {profile.bio && <p className="text-sm text-zinc-300 mt-3">{profile.bio}</p>}
        </div>
      </div>

      <PhotosBlock
        profileUserId={profile.id}
        isOwnProfile={false}
        openAvatarSignal={avatarClickSignal}
        onSelectUser={onSelectUser}
      />

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1">
          Записи на стене ({posts.length})
        </h3>
        {posts.length === 0 ? (
          <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-500 text-sm">
            На стене пока нет записей
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
