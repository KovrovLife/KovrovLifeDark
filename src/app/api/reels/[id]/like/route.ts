import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: reelId } = await params;

    const existing = await prisma.reelLike.findUnique({
      where: {
        userId_reelId: {
          userId: session.userId,
          reelId,
        },
      },
    });

    let isLiked = false;
    if (existing) {
      await prisma.reelLike.delete({ where: { id: existing.id } });
      isLiked = false;
    } else {
      await prisma.reelLike.create({
        data: { userId: session.userId, reelId },
      });
      isLiked = true;
    }

    const likesCount = await prisma.reelLike.count({ where: { reelId } });
    return NextResponse.json({ isLiked, likesCount });
  } catch (error) {
    console.error('Reel like error:', error);
    return NextResponse.json({ error: 'Ошибка лайка' }, { status: 500 });
  }
}
