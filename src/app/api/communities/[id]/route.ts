import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadFileToS3 } from '@/lib/s3';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const currentUserId = session?.userId;
    const { id } = await params;

    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        members: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, username: true, avatarUrl: true } },
            likes: { select: { userId: true } },
            comments: {
              orderBy: { createdAt: 'asc' },
              include: {
                user: { select: { id: true, name: true, username: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    if (!community) {
      return NextResponse.json({ error: 'Сообщество не найдено' }, { status: 404 });
    }

    const formattedPosts = community.posts.map((p) => ({
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
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        description: community.description,
        avatarUrl: community.avatarUrl,
        ownerId: community.ownerId,
        membersCount: community._count.members,
        isMember: Array.isArray(community.members) ? community.members.length > 0 : false,
      },
      posts: formattedPosts,
    });
  } catch (error) {
    console.error('Community details error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки сообщества' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: communityId } = await params;
    const contentType = req.headers.get('content-type') || '';

    // Если это JSON-запрос — переключение подписки на группу
    if (contentType.includes('application/json')) {
      const existing = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: session.userId,
            communityId,
          },
        },
      });

      let isMember = false;
      if (existing) {
        await prisma.communityMember.delete({ where: { id: existing.id } });
        isMember = false;
      } else {
        await prisma.communityMember.create({
          data: { userId: session.userId, communityId },
        });
        isMember = true;
      }

      const membersCount = await prisma.communityMember.count({ where: { communityId } });
      return NextResponse.json({ isMember, membersCount });
    }

    // Иначе это FormData — публикация поста в сообществе
    const formData = await req.formData();
    const content = String(formData.get('content') || '').trim();
    const file = formData.get('image') as File | null;

    if (!content && (!file || file.size === 0)) {
      return NextResponse.json({ error: 'Напишите текст или прикрепите фото' }, { status: 400 });
    }

    let imageUrl: string | null = null;
    if (file && file.size > 0) {
      imageUrl = await uploadFileToS3(file, 'posts');
    }

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl,
        authorId: session.userId,
        communityId,
      },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(
      {
        post: {
          ...post,
          likesCount: 0,
          isLiked: false,
          comments: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Community post/join error:', error);
    return NextResponse.json({ error: 'Ошибка операции в сообществе' }, { status: 500 });
  }
}
