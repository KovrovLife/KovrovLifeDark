'use client';

import { useState, useEffect, useRef } from 'react';
import { UsersRound, Plus, Search, Camera, X, Loader2 } from 'lucide-react';
import CommunityView, { CommunityItem } from './CommunityView';
import { PostItem } from './PostCard';

interface CommunitiesTabProps {
  currentUserId: string;
  onSelectUser: (userId: string) => void;
}

export default function CommunitiesTab({ currentUserId, onSelectUser }: CommunitiesTabProps) {
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const [activeCommunity, setActiveCommunity] = useState<CommunityItem | null>(null);
  const [communityPosts, setCommunityPosts] = useState<PostItem[]>([]);
  const avatarRef = useRef<HTMLInputElement>(null);

  const loadCommunities = async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communities?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setCommunities(data.communities);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadCommunities(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const openCommunity = async (id: string) => {
    const res = await fetch(`/api/communities/${id}`);
    if (res.ok) {
      const data = await res.json();
      setActiveCommunity(data.community);
      setCommunityPosts(data.posts);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetch('/api/communities', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        setName('');
        setDescription('');
        setAvatarFile(null);
        openCommunity(data.community.id);
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleJoin = async (communityId: string) => {
    const res = await fetch(`/api/communities/${communityId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle' }),
    });
    if (res.ok) {
      const data = await res.json();
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? { ...c, isMember: data.isMember, membersCount: data.membersCount }
            : c
        )
      );
      if (activeCommunity?.id === communityId) {
        setActiveCommunity((prev) =>
          prev ? { ...prev, isMember: data.isMember, membersCount: data.membersCount } : null
        );
      }
    }
  };

  if (activeCommunity) {
    return (
      <CommunityView
        community={activeCommunity}
        initialPosts={communityPosts}
        currentUserId={currentUserId}
        onBack={() => {
          setActiveCommunity(null);
          loadCommunities(query);
        }}
        onToggleJoin={toggleJoin}
        onSelectUser={onSelectUser}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-bold text-white">Сообщества</h2>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="h-10 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Создать группу</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск сообществ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-[#141414] border border-zinc-800 rounded-3xl p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Новое сообщество</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Название группы"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white focus:outline-none focus:border-violet-500"
            />
            <textarea
              rows={2}
              placeholder="Описание..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
            />
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="w-full h-11 rounded-2xl bg-[#0a0a0a] border border-dashed border-zinc-700 text-xs text-zinc-300 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>{avatarFile ? avatarFile.name : 'Выбрать аватарку группы'}</span>
            </button>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.item(0) || null)}
              className="hidden"
            />
            <button
              type="submit"
              disabled={!name.trim() || creating}
              className="w-full h-11 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm flex items-center justify-center"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Создать'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      ) : communities.length === 0 ? (
        <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-500 text-sm">
          Сообществ пока нет. Создайте первую группу!
        </div>
      ) : (
        <div className="space-y-2.5">
          {communities.map((c) => (
            <div
              key={c.id}
              className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 flex items-center justify-between gap-3"
            >
              <button
                type="button"
                onClick={() => openCommunity(c.id)}
                className="flex items-center gap-3 min-w-0 text-left flex-1 group"
              >
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    alt={c.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-zinc-700 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-white group-hover:text-violet-400 text-sm truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{c.membersCount} подписчиков</p>
                </div>
              </button>

              <button
                onClick={() => toggleJoin(c.id)}
                className={`h-9 px-3.5 rounded-xl text-xs font-medium shrink-0 ${
                  c.isMember
                    ? 'bg-[#0a0a0a] border border-zinc-700 text-zinc-300'
                    : 'bg-violet-600 hover:bg-violet-500 text-white'
                }`}
              >
                {c.isMember ? 'Вы в группе' : 'Вступить'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
