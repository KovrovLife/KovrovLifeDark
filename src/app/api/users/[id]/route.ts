import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const currentUserId = session?.userId;
    const { id: targetId } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        city: true,
        avatarUrl: true,
        coverUrl: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const [friendsCount, relation, posts] = await Promise.all([
      prisma.friendship.count({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: targetId }, { addresseeId: targetId }],
        },
      }),
      currentUserId && currentUserId !== targetId
        ? prisma.friendship.findFirst({
            where: {
              OR: [
                { requesterId: currentUserId, addresseeId: targetId },
                { requesterId: targetId, addresseeId: currentUserId },
              ],
            },
          })
        : null,
      prisma.post.findMany({
        where: { authorId: targetId, communityId: null },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
          likes: { select: { userId: true } },
          comments: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, username: true, avatarUrl: true } },
            },
          },
        },
      }),
    ]);

    let friendStatus: 'SELF' | 'NONE' | 'SENT' | 'RECEIVED' | 'FRIENDS' = 'NONE';
    if (currentUserId === targetId) {
      friendStatus = 'SELF';
    } else if (relation) {
      if (relation.status === 'ACCEPTED') friendStatus = 'FRIENDS';
      else if (relation.requesterId === currentUserId) friendStatus = 'SENT';
      else friendStatus = 'RECEIVED';
    }

    const formattedPosts = posts.map((p) => ({
      id: p.id,
      content: p.content,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
      author: p.author,
      likesCount: p.likes.length,
      isLiked: currentUserId ? p.likes.some((l) => l.userId === currentUserId) : false,
      comments: p.comments,
    }));

    return NextResponse.json({
      user: {
        ...targetUser,
        friendsCount,
        friendStatus,
      },
      posts: formattedPosts,
    });
  } catch (error) {
    console.error('Public profile error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки профиля' }, { status: 500 });
  }
}
