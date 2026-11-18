'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Video, Square, Trash2, Send, X, Loader2 } from 'lucide-react';

interface MediaRecorderBarProps {
  onSendMedia: (type: 'audio' | 'video', blob: Blob) => Promise<void>;
}

export default function MediaRecorderBar({ onSendMedia }: MediaRecorderBarProps) {
  const [mode, setMode] = useState<'idle' | 'audio' | 'video'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setSeconds(0);
    setMode('idle');
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const startRecording = async (targetMode: 'audio' | 'video') => {
    try {
      cancelledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia(
        targetMode === 'audio'
          ? { audio: true }
          : { audio: true, video: { facingMode: 'user', width: 480, height: 480 } }
      );

      streamRef.current = stream;
      chunksRef.current = [];
      setMode(targetMode);
      setSeconds(0);

      if (targetMode === 'video') {
        setTimeout(() => {
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
            videoPreviewRef.current.play();
          }
        }, 50);
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const recordedChunks = [...chunksRef.current];
        const wasCancelled = cancelledRef.current;
        cleanup();

        if (!wasCancelled && recordedChunks.length > 0) {
          const mimeType = targetMode === 'audio' ? 'audio/webm' : 'video/webm';
          const blob = new Blob(recordedChunks, { type: mimeType });
          setSending(true);
          try {
            await onSendMedia(targetMode, blob);
          } finally {
            setSending(false);
          }
        }
      };

      recorder.start();
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch {
      alert('Разрешите доступ к микрофону или камере в браузере');
      cleanup();
    }
  };

  const stopAndSend = () => {
    cancelledRef.current = false;
    mediaRecorderRef.current?.stop();
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    mediaRecorderRef.current?.stop();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (sending) {
    return (
      <div className="flex items-center gap-2 px-3 text-xs text-violet-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Отправка...</span>
      </div>
    );
  }

  return (
    <>
      {mode === 'idle' && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => startRecording('audio')}
            title="Записать голосовое сообщение"
            className="w-11 h-11 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-violet-400 hover:border-violet-500/50 flex items-center justify-center transition"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => startRecording('video')}
            title="Записать видеокружочек"
            className="w-11 h-11 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50 flex items-center justify-center transition"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      )}

      {mode === 'audio' && (
        <div className="flex-1 flex items-center justify-between gap-2 bg-violet-950/30 border border-violet-500/40 rounded-2xl px-3.5 h-11">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-white">{formatTime(seconds)}</span>
            <span className="text-xs text-zinc-400 hidden sm:inline">Запись голоса...</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-xl text-zinc-400 hover:text-red-400"
              title="Отменить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={stopAndSend}
              className="h-8 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Отправить</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'video' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 gap-5">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-cyan-500 shadow-2xl shadow-cyan-500/20 bg-black">
            <video
              ref={videoPreviewRef}
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute bottom-3 inset-x-0 flex justify-center">
              <span className="px-2.5 py-0.5 rounded-full bg-black/70 text-white text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {formatTime(seconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={cancelRecording}
              className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={stopAndSend}
              className="h-12 px-6 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Отправить кружочек</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
