'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface UserSearchItem {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  followersCount: number;
  postsCount: number;
  isFollowing: boolean;
  isMe: boolean;
}

interface SearchTabProps {
  onFollowChange: () => void;
}

export default function SearchTab({ onFollowChange }: SearchTabProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (searchQuery: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleToggleFollow = async (targetUser: UserSearchItem) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUser.id
          ? {
              ...u,
              isFollowing: !u.isFollowing,
              followersCount: u.isFollowing ? u.followersCount - 1 : u.followersCount + 1,
            }
          : u
      )
    );

    const res = await fetch(`/api/users/${targetUser.id}/follow`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, isFollowing: data.isFollowing, followersCount: data.followersCount }
            : u
        )
      );
      onFollowChange();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Поиск людей по имени или @логину..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-[#141414] border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-400 text-sm">
          Пользователи не найдены
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="w-12 h-12 rounded-full object-cover border border-zinc-700 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {u.name[0]?.toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm sm:text-base truncate">
                    {u.name}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    @{u.username} · {u.followersCount} подписчиков
                  </p>
                  {u.bio && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{u.bio}</p>
                  )}
                </div>
              </div>

              {!u.isMe && (
                <button
                  onClick={() => handleToggleFollow(u)}
                  className={`h-10 px-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-1.5 shrink-0 transition active:scale-95 ${
                    u.isFollowing
                      ? 'bg-[#0a0a0a] text-zinc-300 border border-zinc-700 hover:border-zinc-500'
                      : 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20'
                  }`}
                >
                  {u.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-cyan-400" />
                      <span>Подписаны</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Подписаться</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
