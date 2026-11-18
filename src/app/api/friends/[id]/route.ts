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

    const { id: targetId } = await params;
    if (targetId === session.userId) {
      return NextResponse.json({ error: 'Нельзя добавить себя' }, { status: 400 });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.userId, addresseeId: targetId },
          { requesterId: targetId, addresseeId: session.userId },
        ],
      },
    });

    if (!existing) {
      await prisma.friendship.create({
        data: {
          requesterId: session.userId,
          addresseeId: targetId,
          status: 'PENDING',
        },
      });
      return NextResponse.json({ friendStatus: 'SENT' });
    }

    if (existing.status === 'PENDING' && existing.addresseeId === session.userId) {
      await prisma.friendship.update({
        where: { id: existing.id },
        data: { status: 'ACCEPTED' },
      });
      return NextResponse.json({ friendStatus: 'FRIENDS' });
    }

    await prisma.friendship.delete({ where: { id: existing.id } });
    return NextResponse.json({ friendStatus: 'NONE' });
  } catch (error) {
    console.error('Friend action error:', error);
    return NextResponse.json({ error: 'Ошибка действия с друзьями' }, { status: 500 });
  }
}
