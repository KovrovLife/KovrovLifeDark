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
    const text = String(body.text || '').trim();

    if (!text) {
      return NextResponse.json({ error: 'Комментарий пустой' }, { status: 400 });
    }

    const comment = await prisma.photoComment.create({
      data: {
        text,
        userId: session.userId,
        photoId,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Photo comment error:', error);
    return NextResponse.json({ error: 'Ошибка отправки комментария' }, { status: 500 });
  }
}
