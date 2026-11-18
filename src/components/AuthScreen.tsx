'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? { email, username, name, password }
        : { identifier, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Произошла ошибка');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch {
      setError('Ошибка соединения с сервером');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-[#141414] border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-violet-950/10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            KovrovLife
          </span>
        </div>

        <h1 className="text-xl font-semibold text-center text-white mb-1">
          {isRegister ? 'Создать аккаунт' : 'С возвращением'}
        </h1>
        <p className="text-sm text-zinc-400 text-center mb-6">
          {isRegister
            ? 'Присоединяйся к закрытому тёмному сообществу'
            : 'Войди, чтобы увидеть свежие посты'}
        </p>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister ? (
            <>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
                  Отображаемое имя
                </label>
                <input
                  type="text"
                  required
                  placeholder="Алексей Смирнов"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
                  Логин (латиницей)
                </label>
                <input
                  type="text"
                  required
                  placeholder="alex_dev"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
                Email или логин
              </label>
              <input
                type="text"
                required
                placeholder="alex_dev или you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">
              Пароль
            </label>
            <input
              type="password"
              required
              placeholder="Минимум 6 символов"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-violet-600/20"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Зарегистрироваться' : 'Войти'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-sm text-zinc-400 hover:text-cyan-400 transition"
          >
            {isRegister
              ? 'Уже есть аккаунт? Войти'
              : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
}
