import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadFileToS3 } from '@/lib/s3';

export async function GET() {
  try {
    const now = new Date();

    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Get stories error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки историй' }, { status: 500 });
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
      return NextResponse.json({ error: 'Выберите изображение для истории' }, { status: 400 });
    }

    const imageUrl = await uploadFileToS3(file, 'stories');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    const story = await prisma.story.create({
      data: {
        imageUrl,
        caption: caption || null,
        expiresAt,
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

    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json({ error: 'Не удалось загрузить историю' }, { status: 500 });
  }
}
