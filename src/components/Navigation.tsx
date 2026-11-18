'use client';

import {
  Newspaper,
  MessageSquare,
  Users,
  UsersRound,
  User,
  Video,
  Music,
} from 'lucide-react';

export type Tab =
  | 'feed'
  | 'messages'
  | 'friends'
  | 'communities'
  | 'reels'
  | 'music'
  | 'profile';

interface NavigationProps {
  activeTab: Tab;
  unreadMessages: number;
  incomingRequests: number;
  onSelectTab: (tab: Tab) => void;
}

export default function Navigation({
  activeTab,
  unreadMessages,
  incomingRequests,
  onSelectTab,
}: NavigationProps) {
  const navItems = [
    { id: 'profile' as Tab, label: 'Моя страница', short: 'Профиль', icon: User, badge: 0 },
    { id: 'feed' as Tab, label: 'Новости', short: 'Новости', icon: Newspaper, badge: 0 },
    { id: 'messages' as Tab, label: 'Мессенджер', short: 'Чаты', icon: MessageSquare, badge: unreadMessages },
    { id: 'friends' as Tab, label: 'Друзья', short: 'Друзья', icon: Users, badge: incomingRequests },
    { id: 'communities' as Tab, label: 'Сообщества', short: 'Группы', icon: UsersRound, badge: 0 },
    { id: 'reels' as Tab, label: 'Клипы', short: 'Клипы', icon: Video, badge: 0 },
    { id: 'music' as Tab, label: 'Музыка', short: 'Музыка', icon: Music, badge: 0 },
  ];

  return (
    <>
      <aside className="hidden md:block w-56 shrink-0">
        <div className="sticky top-20 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition ${
                  active
                    ? 'bg-[#141414] text-white border border-zinc-800'
                    : 'text-zinc-400 hover:text-white hover:bg-[#141414]/60'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-zinc-500'}`} />
                  {item.label}
                </span>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[11px] rounded-full bg-violet-600 text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-zinc-800/80 overflow-x-auto">
        <div className="px-1 h-16 flex items-center justify-between min-w-max mx-auto gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition ${
                  active ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium">{item.short}</span>
                {item.badge > 0 && (
                  <span className="absolute top-1 right-1.5 px-1 text-[9px] rounded-full bg-violet-600 text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
