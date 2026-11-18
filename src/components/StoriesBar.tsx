'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react';

export interface StoryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface StoriesBarProps {
  currentUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export default function StoriesBar({ currentUser }: StoriesBarProps) {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const [creating, setCreating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const loadStories = async () => {
    try {
      const res = await fetch('/api/stories');
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.item(0);
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setCreating(true);
    }
  };

  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('caption', caption);

      const res = await fetch('/api/stories', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setStories((prev) => [data.story, ...prev]);
        setCreating(false);
        setFile(null);
        setPreview(null);
        setCaption('');
      }
    } finally {
      setUploading(false);
    }
  };

  const activeStory = activeIndex !== null ? stories[activeIndex] : null;
  return (
    <>
      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-3.5 overflow-x-auto">
        <div className="flex items-center gap-3.5 min-w-max">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 w-16 group"
          >
            <div className="relative w-14 h-14 rounded-full p-0.5 border-2 border-dashed border-zinc-700 group-hover:border-violet-500 transition">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover opacity-80 group-hover:opacity-100"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 font-bold">
                  {currentUser.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center border-2 border-[#141414]">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <span className="text-[11px] text-zinc-400 group-hover:text-white truncate w-full text-center">
              История
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {stories.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="flex flex-col items-center gap-1.5 w-16 group"
            >
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-violet-600 via-pink-500 to-cyan-400 group-hover:scale-105 transition">
                <div className="w-full h-full rounded-full p-[2px] bg-[#141414]">
                  <img
                    src={st.imageUrl}
                    alt={st.author.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[11px] text-zinc-300 truncate w-full text-center">
                {st.author.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {creating && preview && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handlePublishStory}
            className="w-full max-w-sm bg-[#141414] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Новая история (24 ч)</span>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setFile(null);
                  setPreview(null);
                }}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black aspect-[9/14] max-h-[60vh] flex items-center justify-center">
              <img src={preview} alt="История" className="w-full h-full object-contain" />
            </div>

            <div className="p-3.5 flex gap-2">
              <input
                type="text"
                placeholder="Подпись к истории..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="flex-1 h-11 px-3.5 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                disabled={uploading}
                className="h-11 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold text-sm flex items-center gap-1.5"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeStory && activeIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-3">
          <div className="relative w-full max-w-sm bg-[#141414] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute top-0 inset-x-0 z-20 p-3.5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {activeStory.author.avatarUrl ? (
                  <img
                    src={activeStory.author.avatarUrl}
                    alt={activeStory.author.name}
                    className="w-9 h-9 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                    {activeStory.author.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{activeStory.author.name}</p>
                  <p className="text-[11px] text-zinc-300">
                    {new Date(activeStory.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveIndex(null)}
                className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black aspect-[9/15] max-h-[80vh] flex items-center justify-center">
              <img
                src={activeStory.imageUrl}
                alt="Story"
                className="w-full h-full object-contain"
              />

              {activeIndex > 0 && (
                <button
                  onClick={() => setActiveIndex(activeIndex - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {activeIndex < stories.length - 1 && (
                <button
                  onClick={() => setActiveIndex(activeIndex + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {activeStory.caption && (
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  <p className="text-sm text-white text-center">{activeStory.caption}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
