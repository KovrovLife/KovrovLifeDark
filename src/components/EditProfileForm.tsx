'use client';

import { useState, useRef } from 'react';
import { Camera, ImageIcon, Check, X, Loader2 } from 'lucide-react';

interface EditProfileFormProps {
  initialName: string;
  initialCity: string;
  initialBio: string;
  onSaved: () => void;
  onCancel: () => void;
  onPreviewAvatar: (url: string) => void;
  onPreviewCover: (url: string) => void;
}

export default function EditProfileForm({
  initialName,
  initialCity,
  initialBio,
  onSaved,
  onCancel,
  onPreviewAvatar,
  onPreviewCover,
}: EditProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [bio, setBio] = useState(initialBio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('city', city);
      formData.append('bio', bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (coverFile) formData.append('cover', coverFile);

      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка сохранения');
        setSaving(false);
        return;
      }

      onSaved();
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4 pt-4 border-t border-zinc-800">
      {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => avatarRef.current?.click()}
          className="flex-1 h-9 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-xs text-zinc-300 hover:border-violet-500 flex items-center justify-center gap-1.5"
        >
          <Camera className="w-3.5 h-3.5 text-violet-400" />
          <span>{avatarFile ? 'Аватар выбран' : 'Загрузить аватар'}</span>
        </button>

        <button
          type="button"
          onClick={() => coverRef.current?.click()}
          className="flex-1 h-9 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-xs text-zinc-300 hover:border-cyan-500 flex items-center justify-center gap-1.5"
        >
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>{coverFile ? 'Обложка выбрана' : 'Загрузить обложку'}</span>
        </button>
      </div>

      <input
        ref={avatarRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.item(0);
          if (file) {
            setAvatarFile(file);
            onPreviewAvatar(URL.createObjectURL(file));
          }
        }}
        className="hidden"
      />

      <input
        ref={coverRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.item(0);
          if (file) {
            setCoverFile(file);
            onPreviewCover(URL.createObjectURL(file));
          }
        }}
        className="hidden"
      />

      <input
        type="text"
        required
        placeholder="Имя и фамилия"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full h-10 px-3.5 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white focus:outline-none focus:border-violet-500"
      />

      <input
        type="text"
        placeholder="Город (например, Ковров)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full h-10 px-3.5 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white focus:outline-none focus:border-violet-500"
      />

      <textarea
        rows={2}
        placeholder="Статус или информация о себе..."
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        className="w-full p-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>Сохранить</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-xs text-zinc-400 flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          <span>Отмена</span>
        </button>
      </div>
    </form>
  );
}
