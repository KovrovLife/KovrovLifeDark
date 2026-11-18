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

    const { id: postId } = await params;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.userId,
          postId,
        },
      },
    });

    let isLiked = false;

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;
    } else {
      await prisma.like.create({
        data: {
          userId: session.userId,
          postId,
        },
      });
      isLiked = true;
    }

    const likesCount = await prisma.like.count({ where: { postId } });

    return NextResponse.json({ isLiked, likesCount });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Ошибка лайка' }, { status: 500 });
  }
}
