'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MessageSquare, Loader2 } from 'lucide-react';
import MediaRecorderBar from './MediaRecorderBar';

export interface ChatPartner {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

interface DialogItem {
  partner: ChatPartner;
  lastMessage: {
    text: string;
    createdAt: string;
    isMine: boolean;
  };
  unreadCount: number;
}

interface MessageItem {
  id: string;
  text: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  senderId: string;
  createdAt: string;
}

interface MessagesTabProps {
  currentUserId: string;
  initialPartner: ChatPartner | null;
  onClearInitialPartner: () => void;
  onMessagesRead: () => void;
}

export default function MessagesTab({
  currentUserId,
  initialPartner,
  onClearInitialPartner,
  onMessagesRead,
}: MessagesTabProps) {
  const [dialogs, setDialogs] = useState<DialogItem[]>([]);
  const [activePartner, setActivePartner] = useState<ChatPartner | null>(initialPartner);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState('');
  const [loadingDialogs, setLoadingDialogs] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadDialogs = async () => {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        setDialogs(data.dialogs);
      }
    } finally {
      setLoadingDialogs(false);
    }
  };

  const loadHistory = async (partnerId: string) => {
    const res = await fetch(`/api/messages/${partnerId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      onMessagesRead();
    }
  };

  useEffect(() => {
    if (initialPartner) {
      setActivePartner(initialPartner);
      onClearInitialPartner();
    }
  }, [initialPartner, onClearInitialPartner]);

  useEffect(() => {
    loadDialogs();
  }, []);

  useEffect(() => {
    if (!activePartner) return;
    loadHistory(activePartner.id);
    const interval = setInterval(() => loadHistory(activePartner.id), 3000);
    return () => clearInterval(interval);
  }, [activePartner]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activePartner || sending) return;

    setSending(true);
    const msgText = text;
    setText('');

    try {
      const res = await fetch(`/api/messages/${activePartner.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msgText }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        loadDialogs();
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendMedia = async (type: 'audio' | 'video', blob: Blob) => {
    if (!activePartner) return;
    const formData = new FormData();
    formData.append(type, blob, type === 'audio' ? 'voice.webm' : 'circle.webm');

    const res = await fetch(`/api/messages/${activePartner.id}`, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      loadDialogs();
    }
  };
  if (activePartner) {
    return (
      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl overflow-hidden flex flex-col h-[calc(100dvh-140px)]">
        <div className="p-3.5 border-b border-zinc-800 flex items-center gap-3 bg-[#141414]">
          <button
            onClick={() => {
              setActivePartner(null);
              loadDialogs();
            }}
            className="p-2 rounded-xl bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {activePartner.avatarUrl ? (
            <img src={activePartner.avatarUrl} alt={activePartner.name} className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold">
              {activePartner.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <p className="font-semibold text-white text-sm">{activePartner.name}</p>
            <p className="text-xs text-zinc-400">@{activePartner.username}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0a0a]/50">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-zinc-500 py-10">
              Напишите сообщение, отправьте голосовое или кружочек!
            </p>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === currentUserId;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {m.videoUrl ? (
                    <div className="flex flex-col items-end">
                      <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 border-cyan-500/70 shadow-xl bg-black">
                        <video
                          src={m.videoUrl}
                          controls
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 px-2">
                        {new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm break-words ${
                        isMine
                          ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-br-sm'
                          : 'bg-[#1c1c1c] border border-zinc-800 text-zinc-100 rounded-bl-sm'
                      }`}
                    >
                      {m.audioUrl && (
                        <audio src={m.audioUrl} controls className="h-9 max-w-[220px] sm:max-w-[260px]" />
                      )}
                      {m.text && <p>{m.text}</p>}
                      <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/70' : 'text-zinc-500'}`}>
                        {new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSendText} className="p-3 border-t border-zinc-800 flex items-center gap-2 bg-[#141414]">
          <MediaRecorderBar onSendMedia={handleSendMedia} />

          <input
            type="text"
            placeholder="Сообщение..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 h-11 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />

          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-11 h-11 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <span>Мессенджер</span>
        </h2>
      </div>

      {loadingDialogs ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      ) : dialogs.length === 0 ? (
        <div className="bg-[#141414] border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-500 text-sm">
          У вас пока нет диалогов. Откройте раздел «Друзья» и нажмите «Написать сообщение»!
        </div>
      ) : (
        <div className="space-y-2">
          {dialogs.map((d) => (
            <button
              key={d.partner.id}
              onClick={() => setActivePartner(d.partner)}
              className="w-full text-left bg-[#141414] hover:bg-[#191919] border border-zinc-800/80 rounded-3xl p-4 flex items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                {d.partner.avatarUrl ? (
                  <img src={d.partner.avatarUrl} alt={d.partner.name} className="w-12 h-12 rounded-full object-cover border border-zinc-700 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {d.partner.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{d.partner.name}</p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {d.lastMessage.isMine ? 'Вы: ' : ''}
                    {d.lastMessage.text}
                  </p>
                </div>
              </div>

              {d.unreadCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-violet-600 text-white text-xs font-bold shrink-0">
                  {d.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
