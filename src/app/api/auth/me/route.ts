import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
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

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const [friendsCount, incomingRequestsCount, unreadMessagesCount] = await Promise.all([
      prisma.friendship.count({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        },
      }),
      prisma.friendship.count({
        where: {
          status: 'PENDING',
          addresseeId: user.id,
        },
      }),
      prisma.message.count({
        where: {
          receiverId: user.id,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      user: {
        ...user,
        friendsCount,
        incomingRequestsCount,
        unreadMessagesCount,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
