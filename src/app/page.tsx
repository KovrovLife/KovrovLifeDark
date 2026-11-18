'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Sparkles, Loader2 } from 'lucide-react';
import AuthScreen from '@/components/AuthScreen';
import PostCard, { PostItem } from '@/components/PostCard';
import FriendsTab from '@/components/FriendsTab';
import MessagesTab, { ChatPartner } from '@/components/MessagesTab';
import ProfileTab, { UserProfile } from '@/components/ProfileTab';
import StoriesBar from '@/components/StoriesBar';
import ReelsTab from '@/components/ReelsTab';
import MusicTab, { TrackItem } from '@/components/MusicTab';
import CommunitiesTab from '@/components/CommunitiesTab';
import UserProfileView from '@/components/UserProfileView';
import Navigation, { Tab } from '@/components/Navigation';
import FeedComposer from '@/components/FeedComposer';

export default function SocialApp() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const [currentTrack, setCurrentTrack] = useState<TrackItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadMe = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    if (user) {
      loadPosts();
      const timer = setInterval(loadMe, 8000);
      return () => clearInterval(timer);
    }
  }, [user?.id]);

  const handleOpenUser = (targetId: string) => {
    if (targetId === user?.id) {
      setViewingUserId(null);
      setActiveTab('profile');
    } else {
      setViewingUserId(targetId);
    }
  };

  const handleSelectTrack = (track: TrackItem) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play(), 50);
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen onSuccess={loadMe} />;

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-zinc-100 pb-24 md:pb-12">
      <audio ref={audioRef} src={currentTrack?.audioUrl} onEnded={() => setIsPlaying(false)} />

      <header className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setViewingUserId(null);
              setActiveTab('feed');
            }}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white">Kovrov<span className="text-emerald-400">Life</span></span>
          </button>

          {currentTrack && (
            <div className="flex items-center gap-2 bg-[#141414] border border-zinc-800 rounded-full px-3 py-1 max-w-[200px] sm:max-w-xs">
              <button
                onClick={() => handleSelectTrack(currentTrack)}
                className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0"
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
              </button>
              <p className="text-xs text-zinc-200 truncate">
                <span className="font-semibold">{currentTrack.artist}</span> — {currentTrack.title}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setViewingUserId(null);
              setActiveTab('profile');
            }}
            className="shrink-0"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-zinc-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-200 font-bold text-xs">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-5 flex gap-6">
        <Navigation
          activeTab={activeTab}
          unreadMessages={user.unreadMessagesCount}
          incomingRequests={user.incomingRequestsCount}
          onSelectTab={(tab) => {
            setViewingUserId(null);
            setActiveTab(tab);
          }}
        />

        <main className="flex-1 max-w-2xl mx-auto md:mx-0">
          {viewingUserId ? (
            <UserProfileView
              userId={viewingUserId}
              currentUserId={user.id}
              onBack={() => setViewingUserId(null)}
              onSelectUser={handleOpenUser}
              onUpdateCounts={loadMe}
              onOpenChat={(partner) => {
                setViewingUserId(null);
                setChatPartner(partner);
                setActiveTab('messages');
              }}
            />
          ) : (
            <>
              {activeTab === 'feed' && (
                <div className="space-y-4">
                  <StoriesBar currentUser={user} />
                  <FeedComposer
                    userName={user.name}
                    onPostCreated={(newPost) => {
                      setPosts((prev) => [newPost, ...prev]);
                      loadMe();
                    }}
                  />
                  {postsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-10 text-center text-zinc-500 text-sm">
                      Лента новостей пока пуста. Опубликуйте первую запись!
                    </div>
                  ) : (
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={user.id}
                        onSelectUser={handleOpenUser}
                        onDelete={(id) => {
                          setPosts((prev) => prev.filter((p) => p.id !== id));
                          loadMe();
                        }}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'messages' && (
                <MessagesTab
                  currentUserId={user.id}
                  initialPartner={chatPartner}
                  onClearInitialPartner={() => setChatPartner(null)}
                  onMessagesRead={loadMe}
                />
              )}

              {activeTab === 'friends' && (
                <FriendsTab
                  onSelectUser={handleOpenUser}
                  onUpdateCounts={loadMe}
                  onOpenChat={(partner) => {
                    setChatPartner(partner);
                    setActiveTab('messages');
                  }}
                />
              )}

              {activeTab === 'communities' && (
                <CommunitiesTab currentUserId={user.id} onSelectUser={handleOpenUser} />
              )}

              {activeTab === 'reels' && <ReelsTab />}

              {activeTab === 'music' && (
                <MusicTab
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onSelectTrack={handleSelectTrack}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileTab
                  user={user}
                  userPosts={posts.filter((p) => p.author.id === user.id)}
                  onSelectUser={handleOpenUser}
                  onOpenFriends={() => setActiveTab('friends')}
                  onProfileUpdated={() => {
                    loadMe();
                    loadPosts();
                  }}
                  onDeletePost={(id) => {
                    setPosts((prev) => prev.filter((p) => p.id !== id));
                    loadMe();
                  }}
                  onLogout={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    setUser(null);
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
