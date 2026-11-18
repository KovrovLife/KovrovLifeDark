import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadFileToS3 } from '@/lib/s3';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const currentUserId = session?.userId;
    const { searchParams } = new URL(req.url);
    const userId = String(searchParams.get('userId') || '').trim();

    if (!userId) {
      return NextResponse.json({ error: 'Не указан userId' }, { status: 400 });
    }

    const photos = await prisma.photo.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
        reactions: { select: { userId: true, type: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    const formatted = photos.map((p) => {
      const likesCount = p.reactions.filter((r) => r.type === 'LIKE').length;
      const dislikesCount = p.reactions.filter((r) => r.type === 'DISLIKE').length;
      const myReaction = currentUserId
        ? (p.reactions.find((r) => r.userId === currentUserId)?.type as 'LIKE' | 'DISLIKE' | undefined) || null
        : null;

      return {
        id: p.id,
        imageUrl: p.imageUrl,
        caption: p.caption,
        createdAt: p.createdAt,
        owner: p.owner,
        comments: p.comments,
        likesCount,
        dislikesCount,
        myReaction,
      };
    });

    return NextResponse.json({ photos: formatted });
  } catch (error) {
    console.error('Get photos error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки фотографий' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const formData = await req.formData();
    const caption = String(formData.get('caption') || '').trim();
    const file = formData.get('image') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Выберите фотографию' }, { status: 400 });
    }

    const imageUrl = await uploadFileToS3(file, 'photos');

    const photo = await prisma.photo.create({
      data: {
        imageUrl,
        caption: caption || null,
        ownerId: session.userId,
      },
      include: {
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(
      {
        photo: {
          ...photo,
          comments: [],
          likesCount: 0,
          dislikesCount: 0,
          myReaction: null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки фотографии' }, { status: 500 });
  }
}
