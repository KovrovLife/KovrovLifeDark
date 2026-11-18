import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const username = String(body.username || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const password = String(body.password || '');

    if (!email || !username || !name || !password) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: 'Логин может содержать только латинские буквы, цифры и _ (от 3 до 20 символов)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть не короче 6 символов' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email или логином уже существует' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatarUrl: true,
      },
    });

    await createSession({ userId: user.id, username: user.username });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при регистрации' },
      { status: 500 }
    );
  }
}
