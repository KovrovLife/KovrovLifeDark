'use client';

import { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Plus, Search, Upload, X, Loader2 } from 'lucide-react';

export interface TrackItem {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
}

interface MusicTabProps {
  currentTrack: TrackItem | null;
  isPlaying: boolean;
  onSelectTrack: (track: TrackItem) => void;
}

export default function MusicTab({
  currentTrack,
  isPlaying,
  onSelectTrack,
}: MusicTabProps) {
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTracks = async (searchText = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tracks?q=${encodeURIComponent(searchText)}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadTracks(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !audioFile || uploading) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('audio', audioFile);

      const res = await fetch('/api/tracks', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка загрузки трека');
        setUploading(false);
        return;
      }

      setTracks((prev) => [data.track, ...prev]);
      setShowUpload(false);
      setTitle('');
      setArtist('');
      setAudioFile(null);
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Музыка</h2>
          </div>

          <button
            onClick={() => setShowUpload(true)}
            className="h-10 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Загрузить трек</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск по названию трека или исполнителю..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleUpload}
            className="w-full max-w-md bg-[#141414] border border-zinc-800 rounded-3xl p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Добавить аудиозапись</h3>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl">{error}</p>}

            <input
              type="text"
              required
              placeholder="Исполнитель (например, Miyagi)"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />

            <input
              type="text"
              required
              placeholder="Название трека"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-cyan-500 rounded-2xl p-5 text-center cursor-pointer transition"
            >
              <Upload className="w-7 h-7 text-cyan-400 mx-auto mb-1.5" />
              <p className="text-sm text-zinc-200 font-medium">
                {audioFile ? audioFile.name : 'Выберите MP3 / WAV файл (до 25 МБ)'}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.item(0) || null)}

              className="hidden"
            />

            <button
              type="submit"
              disabled={!title.trim() || !artist.trim() || !audioFile || uploading}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Загрузить</span>}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
        </div>
      ) : tracks.length === 0 ? (
        <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-500 text-sm">
          Треков пока нет. Загрузите первую песню!
        </div>
      ) : (
        <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl divide-y divide-zinc-800/70 overflow-hidden">
          {tracks.map((track) => {
            const active = currentTrack?.id === track.id;
            return (
              <button
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition ${
                  active ? 'bg-violet-500/10' : 'hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      active
                        ? 'bg-gradient-to-tr from-violet-600 to-cyan-500 text-white'
                        : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {active && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        active ? 'text-cyan-400' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
