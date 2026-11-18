'use client';

import { useState, useRef } from 'react';
import { ImagePlus, Send, X, Loader2 } from 'lucide-react';
import { PostItem } from './PostCard';

interface FeedComposerProps {
  userName: string;
  onPostCreated: (post: PostItem) => void;
}

export default function FeedComposer({ userName, onPostCreated }: FeedComposerProps) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || publishing) return;

    setPublishing(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('content', text);
      if (selectedFile) formData.append('image', selectedFile);

      const res = await fetch('/api/posts', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Не удалось опубликовать запись');
        setPublishing(false);
        return;
      }

      onPostCreated(data.post);
      setText('');
      setSelectedFile(null);
      setPreview(null);
    } catch {
      setError('Ошибка при отправке');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 space-y-3">
      <textarea
        rows={2}
        placeholder={`Что у вас нового, ${userName}?`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-transparent text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none resize-none"
      />

      {preview && (
        <div className="relative rounded-2xl overflow-hidden border border-zinc-800">
          <img src={preview} alt="Предпросмотр" className="w-full max-h-64 object-cover" />
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setPreview(null);
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/75 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl">{error}</p>}

      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/70">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-cyan-400 text-xs sm:text-sm transition"
        >
          <ImagePlus className="w-4 h-4" />
          <span>Фото</span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.item(0);
            if (file) {
              setSelectedFile(file);
              setPreview(URL.createObjectURL(file));
            }
          }}
          className="hidden"
        />

        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || publishing}
          className="h-10 px-5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition"
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Опубликовать</span><Send className="w-3.5 h-3.5" /></>}
        </button>
      </div>
    </form>
  );
}
