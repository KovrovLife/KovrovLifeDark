import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = String(searchParams.get('q') || '').trim();

    const [users, friendships] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { not: session.userId },
          ...(query
            ? {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { username: { contains: query, mode: 'insensitive' } },
                  { city: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          username: true,
          bio: true,
          city: true,
          avatarUrl: true,
        },
      }),
      prisma.friendship.findMany({
        where: {
          OR: [{ requesterId: session.userId }, { addresseeId: session.userId }],
        },
      }),
    ]);

    const formatted = users.map((u) => {
      const relation = friendships.find(
        (f) =>
          (f.requesterId === session.userId && f.addresseeId === u.id) ||
          (f.addresseeId === session.userId && f.requesterId === u.id)
      );

      let friendStatus: 'NONE' | 'SENT' | 'RECEIVED' | 'FRIENDS' = 'NONE';
      if (relation) {
        if (relation.status === 'ACCEPTED') friendStatus = 'FRIENDS';
        else if (relation.requesterId === session.userId) friendStatus = 'SENT';
        else friendStatus = 'RECEIVED';
      }

      return { ...u, friendStatus };
    });

    return NextResponse.json({ users: formatted });
  } catch (error) {
    console.error('Friends list error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки списка друзей' }, { status: 500 });
  }
}
