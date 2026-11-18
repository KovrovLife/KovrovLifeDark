import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadFileToS3 } from '@/lib/s3';

export async function GET() {
  try {
    const session = await getSession();
    const currentUserId = session?.userId;

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      author: post.author,
      likesCount: post.likes.length,
      isLiked: currentUserId
        ? post.likes.some((like) => like.userId === currentUserId)
        : false,
      comments: post.comments,
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить ленту' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Необходимо войти в аккаунт' }, { status: 401 });
    }

    const formData = await req.formData();
    const content = String(formData.get('content') || '').trim();
    const file = formData.get('image') as File | null;

    if (!content && (!file || file.size === 0)) {
      return NextResponse.json(
        { error: 'Напишите текст или прикрепите картинку' },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;
    if (file && file.size > 0) {
      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Размер изображения не должен превышать 8 МБ' },
          { status: 400 }
        );
      }
      imageUrl = await uploadFileToS3(file, 'posts');
    }

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl,
        authorId: session.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
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
  } catch (error: unknown) {
    console.error('Create post error:', error);
    const message = error instanceof Error ? error.message : 'Ошибка при создании поста';
    return NextResponse.json(
      { error: `Ошибка: ${message}` },
      { status: 500 }
    );
  }
}
