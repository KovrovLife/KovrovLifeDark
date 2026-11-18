'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  Clock,
  Loader2,
} from 'lucide-react';

export interface FriendUser {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  city: string | null;
  avatarUrl: string | null;
  friendStatus: 'NONE' | 'SENT' | 'RECEIVED' | 'FRIENDS';
}

interface FriendsTabProps {
  onOpenChat: (partner: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  }) => void;
  onSelectUser: (userId: string) => void;
  onUpdateCounts: () => void;
}

export default function FriendsTab({
  onOpenChat,
  onSelectUser,
  onUpdateCounts,
}: FriendsTabProps) {
  const [subTab, setSubTab] = useState<'all' | 'requests' | 'search'>('all');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async (searchText = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends?q=${encodeURIComponent(searchText)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleFriendAction = async (targetId: string) => {
    const res = await fetch(`/api/friends/${targetId}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, friendStatus: data.friendStatus } : u))
      );
      onUpdateCounts();
    }
  };

  const friendsList = users.filter((u) => u.friendStatus === 'FRIENDS');
  const requestsList = users.filter((u) => u.friendStatus === 'RECEIVED');
  const displayedUsers =
    subTab === 'all' ? friendsList : subTab === 'requests' ? requestsList : users;

  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSubTab('all')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium transition ${
              subTab === 'all'
                ? 'bg-violet-600 text-white'
                : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Мои друзья ({friendsList.length})
          </button>

          <button
            onClick={() => setSubTab('requests')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
              subTab === 'requests'
                ? 'bg-violet-600 text-white'
                : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <span>Заявки</span>
            {requestsList.length > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-cyan-500 text-black font-bold">
                {requestsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('search')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium transition ${
              subTab === 'search'
                ? 'bg-violet-600 text-white'
                : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Найти друзей
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск по имени, @логину или городу..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (subTab !== 'search' && e.target.value.trim()) setSubTab('search');
            }}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      ) : displayedUsers.length === 0 ? (
        <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-500 text-sm">
          {subTab === 'all'
            ? 'У вас пока нет друзей. Перейдите во вкладку «Найти друзей»!'
            : subTab === 'requests'
            ? 'Новых заявок в друзья нет'
            : 'Пользователи не найдены'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedUsers.map((u) => (
            <div
              key={u.id}
              className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button type="button" onClick={() => onSelectUser(u.id)} className="shrink-0">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectUser(u.id)}
                    className="font-semibold text-white hover:text-violet-400 text-sm sm:text-base truncate block text-left"
                  >
                    {u.name}
                  </button>
                  <p className="text-xs text-zinc-400 truncate">
                    @{u.username} {u.city ? `· ${u.city}` : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenChat({
                        id: u.id,
                        name: u.name,
                        username: u.username,
                        avatarUrl: u.avatarUrl,
                      })
                    }
                    className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Написать сообщение</span>
                  </button>
                </div>
              </div>

              <div className="shrink-0">
                {u.friendStatus === 'NONE' && (
                  <button
                    onClick={() => handleFriendAction(u.id)}
                    className="h-10 px-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>В друзья</span>
                  </button>
                )}

                {u.friendStatus === 'SENT' && (
                  <button
                    onClick={() => handleFriendAction(u.id)}
                    className="h-10 px-3.5 rounded-2xl bg-[#0a0a0a] border border-zinc-700 text-zinc-400 hover:text-red-400 text-xs font-medium flex items-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Заявка</span>
                  </button>
                )}

                {u.friendStatus === 'RECEIVED' && (
                  <button
                    onClick={() => handleFriendAction(u.id)}
                    className="h-10 px-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Принять</span>
                  </button>
                )}

                {u.friendStatus === 'FRIENDS' && (
                  <button
                    onClick={() => handleFriendAction(u.id)}
                    className="h-10 px-3.5 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-zinc-300 hover:text-red-400 text-xs font-medium flex items-center gap-1.5"
                  >
                    <UserX className="w-4 h-4" />
                    <span>В друзьях</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
