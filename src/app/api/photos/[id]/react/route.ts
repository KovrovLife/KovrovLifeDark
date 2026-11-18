import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: photoId } = await params;
    const body = await req.json();
    const type = body.type === 'DISLIKE' ? 'DISLIKE' : 'LIKE';

    const existing = await prisma.photoReaction.findUnique({
      where: {
        userId_photoId: {
          userId: session.userId,
          photoId,
        },
      },
    });

    let myReaction: 'LIKE' | 'DISLIKE' | null = null;

    if (existing) {
      if (existing.type === type) {
        await prisma.photoReaction.delete({ where: { id: existing.id } });
        myReaction = null;
      } else {
        await prisma.photoReaction.update({
          where: { id: existing.id },
          data: { type },
        });
        myReaction = type;
      }
    } else {
      await prisma.photoReaction.create({
        data: { userId: session.userId, photoId, type },
      });
      myReaction = type;
    }

    const [likesCount, dislikesCount] = await Promise.all([
      prisma.photoReaction.count({ where: { photoId, type: 'LIKE' } }),
      prisma.photoReaction.count({ where: { photoId, type: 'DISLIKE' } }),
    ]);

    return NextResponse.json({ myReaction, likesCount, dislikesCount });
  } catch (error) {
    console.error('Photo react error:', error);
    return NextResponse.json({ error: 'Ошибка реакции' }, { status: 500 });
  }
}
