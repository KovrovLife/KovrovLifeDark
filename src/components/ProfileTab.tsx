'use client';

import { useState } from 'react';
import { LogOut, Edit3, MapPin } from 'lucide-react';
import PostCard, { PostItem } from './PostCard';
import EditProfileForm from './EditProfileForm';
import PhotosBlock from './PhotosBlock';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  city: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  friendsCount: number;
  incomingRequestsCount: number;
  unreadMessagesCount: number;
}

interface ProfileTabProps {
  user: UserProfile;
  userPosts: PostItem[];
  onProfileUpdated: () => void;
  onDeletePost: (postId: string) => void;
  onOpenFriends: () => void;
  onSelectUser: (userId: string) => void;
  onLogout: () => void;
}

export default function ProfileTab({
  user,
  userPosts,
  onProfileUpdated,
  onDeletePost,
  onOpenFriends,
  onSelectUser,
  onLogout,
}: ProfileTabProps) {
  const [editing, setEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarClickSignal, setAvatarClickSignal] = useState(0);

  const displayAvatar = avatarPreview || user.avatarUrl;
  const displayCover = coverPreview || user.coverUrl;

  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl overflow-hidden">
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-violet-900/50 via-indigo-900/40 to-cyan-900/50 border-b border-zinc-800/60">
          {displayCover && (
            <img src={displayCover} alt="Обложка" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4 relative z-10">
            {displayAvatar ? (
              <button
                type="button"
                onClick={() => setAvatarClickSignal((s) => s + 1)}
                title="Открыть фотографию профиля"
                className="rounded-full focus:outline-none group"
              >
                <img
                  src={displayAvatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-[#141414] group-hover:brightness-110 transition"
                />
              </button>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-[#141414]">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex items-center gap-2">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="h-9 px-3.5 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-xs font-medium text-zinc-300 hover:border-violet-500 hover:text-white flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Редактировать</span>
                </button>
              )}

              <button
                onClick={onLogout}
                title="Выйти"
                className="h-9 w-9 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-red-400 flex items-center justify-center transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
            <span>@{user.username}</span>
            {user.city && (
              <span className="flex items-center gap-1 text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {user.city}
              </span>
            )}
          </div>

          {editing ? (
            <EditProfileForm
              initialName={user.name}
              initialCity={user.city || ''}
              initialBio={user.bio || ''}
              onPreviewAvatar={(url) => setAvatarPreview(url)}
              onPreviewCover={(url) => setCoverPreview(url)}
              onSaved={() => {
                setEditing(false);
                setAvatarPreview(null);
                setCoverPreview(null);
                onProfileUpdated();
              }}
              onCancel={() => {
                setEditing(false);
                setAvatarPreview(null);
                setCoverPreview(null);
              }}
            />
          ) : (
            <>
              {user.bio && <p className="text-sm text-zinc-300 mt-3">{user.bio}</p>}

              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-zinc-800/80">
                <button
                  onClick={onOpenFriends}
                  className="bg-[#0a0a0a] hover:bg-zinc-900 border border-zinc-800/80 rounded-2xl py-2.5 text-center transition"
                >
                  <p className="text-lg font-bold text-white">{user.friendsCount}</p>
                  <p className="text-xs text-zinc-400">Друзей</p>
                </button>
                <div className="bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl py-2.5 text-center">
                  <p className="text-lg font-bold text-white">{userPosts.length}</p>
                  <p className="text-xs text-zinc-400">Записей на стене</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <PhotosBlock
        profileUserId={user.id}
        isOwnProfile={true}
        openAvatarSignal={avatarClickSignal}
        onSelectUser={onSelectUser}
      />

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1">
          Стена
        </h3>
        {userPosts.length === 0 ? (
          <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-500 text-sm">
            На стене пока нет записей
          </div>
        ) : (
          userPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user.id}
              onDelete={onDeletePost}
              onSelectUser={onSelectUser}
            />
          ))
        )}
      </div>
    </div>
  );
}
