import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const query = String(searchParams.get('q') || '').trim();

    const users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { username: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        city: true,
        avatarUrl: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      bio: u.bio,
      city: u.city,
      avatarUrl: u.avatarUrl,
      postsCount: u._count.posts,
      isMe: session?.userId === u.id,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json({ error: 'Ошибка поиска пользователей' }, { status: 500 });
  }
}
