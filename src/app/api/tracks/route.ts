import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadFileToS3 } from '@/lib/s3';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = String(searchParams.get('q') || '').trim();

    const tracks = await prisma.track.findMany({
      where: query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { artist: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Get tracks error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки музыки' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const formData = await req.formData();
    const title = String(formData.get('title') || '').trim();
    const artist = String(formData.get('artist') || '').trim();
    const file = formData.get('audio') as File | null;

    if (!title || !artist || !file || file.size === 0) {
      return NextResponse.json(
        { error: 'Укажите название, исполнителя и выберите аудиофайл' },
        { status: 400 }
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Максимальный размер трека — 25 МБ' }, { status: 400 });
    }

    const audioUrl = await uploadFileToS3(file, 'music');

    const track = await prisma.track.create({
      data: {
        title,
        artist,
        audioUrl,
        uploaderId: session.userId,
      },
    });

    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    console.error('Upload track error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки трека' }, { status: 500 });
  }
}
