'use client';

import { useState, useEffect, useRef } from 'react';
import { Video, Plus, Heart, X, Upload, Loader2, Volume2, VolumeX } from 'lucide-react';

export interface ReelItem {
  id: string;
  videoUrl: string;
  description: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  likesCount: number;
  isLiked: boolean;
}

export default function ReelsTab() {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadReels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reels');
      if (res.ok) {
        const data = await res.json();
        setReels(data.reels);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReels();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || uploading) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('description', description);

      const res = await fetch('/api/reels', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка загрузки видео');
        setUploading(false);
        return;
      }

      setReels((prev) => [data.reel, ...prev]);
      setShowUpload(false);
      setVideoFile(null);
      setDescription('');
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (reel: ReelItem) => {
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? {
              ...r,
              isLiked: !r.isLiked,
              likesCount: r.isLiked ? r.likesCount - 1 : r.likesCount + 1,
            }
          : r
      )
    );

    const res = await fetch(`/api/reels/${reel.id}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setReels((prev) =>
        prev.map((r) =>
          r.id === reel.id ? { ...r, isLiked: data.isLiked, likesCount: data.likesCount } : r
        )
      );
    }
  };
  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-pink-500" />
          <h2 className="text-base font-bold text-white">Клипы</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(!muted)}
            className="p-2.5 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white"
            title={muted ? 'Включить звук' : 'Выключить звук'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowUpload(true)}
            className="h-10 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Опубликовать клип</span>
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleUpload}
            className="w-full max-w-md bg-[#141414] border border-zinc-800 rounded-3xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Загрузить клип</h3>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl">{error}</p>}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-violet-500 rounded-2xl p-6 text-center cursor-pointer transition"
            >
              <Upload className="w-8 h-8 text-violet-400 mx-auto mb-2" />
              <p className="text-sm text-zinc-200 font-medium">
                {videoFile ? videoFile.name : 'Нажмите, чтобы выбрать видео (MP4/MOV)'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">До 50 МБ</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.item(0) || null)}
              className="hidden"
            />

            <input
              type="text"
              placeholder="Описание клипа..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />

            <button
              type="submit"
              disabled={!videoFile || uploading}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Опубликовать</span>}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      ) : reels.length === 0 ? (
        <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-10 text-center text-zinc-500 text-sm">
          Клипов пока нет. Загрузите первое вертикальное видео!
        </div>
      ) : (
        <div className="space-y-5">
          {reels.map((reel) => (
            <div
              key={reel.id}
              className="relative bg-black border border-zinc-800 rounded-3xl overflow-hidden max-w-sm mx-auto shadow-2xl"
            >
              <video
                src={reel.videoUrl}
                controls
                loop
                playsInline
                muted={muted}
                className="w-full aspect-[9/16] max-h-[75vh] object-cover bg-black"
              />

              <div className="p-4 bg-[#141414] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{reel.author.name}</p>
                  {reel.description && (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{reel.description}</p>
                  )}
                </div>

                <button
                  onClick={() => toggleLike(reel)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold transition shrink-0 ${
                    reel.isLiked
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                      : 'bg-[#0a0a0a] text-zinc-400 border border-zinc-800'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${reel.isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
                  <span>{reel.likesCount}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
