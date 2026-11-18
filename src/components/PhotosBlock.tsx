'use client';

import { useState, useEffect, useRef } from 'react';
import { ImageIcon, Plus, Loader2 } from 'lucide-react';
import PhotoViewerModal, { PhotoItem, PhotoCommentItem } from './PhotoViewerModal';

interface PhotosBlockProps {
  profileUserId: string;
  isOwnProfile: boolean;
  openAvatarSignal?: number;
  onSelectUser: (userId: string) => void;
}

export default function PhotosBlock({
  profileUserId,
  isOwnProfile,
  openAvatarSignal,
  onSelectUser,
}: PhotosBlockProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/photos?userId=${encodeURIComponent(profileUserId)}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [profileUserId]);

  useEffect(() => {
    if (openAvatarSignal && openAvatarSignal > 0 && photos.length > 0) {
      setViewerIndex(0);
    }
  }, [openAvatarSignal]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (!file || uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/photos', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setPhotos((prev) => [data.photo, ...prev]);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleCommentAdded = (photoId: string, comment: PhotoCommentItem) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, comments: [...p.comments, comment] } : p))
    );
  };

  const handleReactionUpdated = (
    photoId: string,
    data: { myReaction: 'LIKE' | 'DISLIKE' | null; likesCount: number; dislikesCount: number }
  ) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, ...data } : p))
    );
  };

  return (
    <>
      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Фотографии <span className="text-zinc-500 font-normal">{photos.length}</span>
            </h3>
          </div>

          {isOwnProfile && (
            <>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="h-8 px-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 hover:border-violet-500 text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 text-violet-400" />}
                <span>Добавить фото</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
            </>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">
            {isOwnProfile ? 'Загрузите первые фотографии в свой альбом' : 'У пользователя пока нет фотографий'}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setViewerIndex(idx)}
                className="relative aspect-square rounded-2xl overflow-hidden bg-[#0a0a0a] border border-zinc-800/80 group"
              >
                <img
                  src={photo.imageUrl}
                  alt="Фото"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {(photo.likesCount > 0 || photo.comments.length > 0) && (
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-lg bg-black/75 text-[10px] text-white font-medium">
                    👍 {photo.likesCount} · 💬 {photo.comments.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {viewerIndex !== null && (
        <PhotoViewerModal
          photos={photos}
          activeIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onChangeIndex={(idx) => setViewerIndex(idx)}
          onCommentAdded={handleCommentAdded}
          onReactionUpdated={handleReactionUpdated}
          onSelectUser={onSelectUser}
        />
      )}
    </>
  );
}
