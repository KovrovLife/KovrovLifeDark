'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Send, ThumbsUp, ThumbsDown } from 'lucide-react';

export interface PhotoCommentItem {
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

export interface PhotoItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  comments: PhotoCommentItem[];
  likesCount: number;
  dislikesCount: number;
  myReaction: 'LIKE' | 'DISLIKE' | null;
}

interface PhotoViewerModalProps {
  photos: PhotoItem[];
  activeIndex: number;
  onClose: () => void;
  onChangeIndex: (newIndex: number) => void;
  onCommentAdded: (photoId: string, comment: PhotoCommentItem) => void;
  onReactionUpdated: (
    photoId: string,
    data: { myReaction: 'LIKE' | 'DISLIKE' | null; likesCount: number; dislikesCount: number }
  ) => void;
  onSelectUser: (userId: string) => void;
}

export default function PhotoViewerModal({
  photos,
  activeIndex,
  onClose,
  onChangeIndex,
  onCommentAdded,
  onReactionUpdated,
  onSelectUser,
}: PhotoViewerModalProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const photo = photos[activeIndex];
  if (!photo) return null;

  const handleReact = async (type: 'LIKE' | 'DISLIKE') => {
    const res = await fetch(`/api/photos/${photo.id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const data = await res.json();
      onReactionUpdated(photo.id, data);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        onCommentAdded(photo.id, data.comment);
        setText('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-[#141414] border border-zinc-800 rounded-3xl overflow-hidden flex flex-col md:flex-row max-h-[92dvh] shadow-2xl">
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[250px] max-h-[48dvh] md:max-h-[92dvh]">
          <img
            src={photo.imageUrl}
            alt={photo.caption || 'Фотография'}
            className="max-w-full max-h-full object-contain"
          />

          <button
            type="button"
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          {activeIndex > 0 && (
            <button
              type="button"
              onClick={() => onChangeIndex(activeIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {activeIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={() => onChangeIndex(activeIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col max-h-[44dvh] md:max-h-[92dvh]">
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectUser(photo.owner.id);
              }}
              className="flex items-center gap-2.5 min-w-0 text-left"
            >
              {photo.owner.avatarUrl ? (
                <img src={photo.owner.avatarUrl} alt={photo.owner.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xs">
                  {photo.owner.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{photo.owner.name}</p>
                <p className="text-[11px] text-zinc-400">
                  Фото {activeIndex + 1} из {photos.length}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="hidden md:flex w-8 h-8 rounded-xl bg-[#0a0a0a] text-zinc-400 hover:text-white items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3.5 py-2.5 border-b border-zinc-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleReact('LIKE')}
              className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                photo.myReaction === 'LIKE'
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                  : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{photo.likesCount}</span>
            </button>

            <button
              type="button"
              onClick={() => handleReact('DISLIKE')}
              className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                photo.myReaction === 'DISLIKE'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>{photo.dislikesCount}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {photo.caption && (
              <p className="text-xs text-zinc-200 pb-2.5 border-b border-zinc-800/80">
                {photo.caption}
              </p>
            )}

            {photo.comments.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">
                Комментариев пока нет. Напишите первый!
              </p>
            ) : (
              photo.comments.map((c) => (
                <div key={c.id} className="bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl p-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectUser(c.user.id);
                    }}
                    className="text-[11px] font-semibold text-zinc-200 hover:text-violet-400 block text-left"
                  >
                    {c.user.name}
                  </button>
                  <p className="text-xs text-zinc-300 mt-0.5 break-words">{c.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 flex gap-2 bg-[#141414]">
            <input
              type="text"
              placeholder="Комментарий к фото..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 h-10 px-3.5 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
