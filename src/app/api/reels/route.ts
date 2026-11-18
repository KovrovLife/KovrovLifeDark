import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadFileToS3 } from '@/lib/s3';

export async function GET() {
  try {
    const session = await getSession();
    const currentUserId = session?.userId;

    const reels = await prisma.reel.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
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
          select: { userId: true },
        },
      },
    });

    const formatted = reels.map((r) => ({
      id: r.id,
      videoUrl: r.videoUrl,
      description: r.description,
      createdAt: r.createdAt,
      author: r.author,
      likesCount: r.likes.length,
      isLiked: currentUserId ? r.likes.some((l) => l.userId === currentUserId) : false,
    }));

    return NextResponse.json({ reels: formatted });
  } catch (error) {
    console.error('Get reels error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки клипов' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const formData = await req.formData();
    const description = String(formData.get('description') || '').trim();
    const file = formData.get('video') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Выберите видеофайл' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Максимальный размер видео — 50 МБ' }, { status: 400 });
    }

    const videoUrl = await uploadFileToS3(file, 'reels');

    const reel = await prisma.reel.create({
      data: {
        videoUrl,
        description: description || null,
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
        reel: {
          ...reel,
          likesCount: 0,
          isLiked: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create reel error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки клипа' }, { status: 500 });
  }
}
