import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadFileToS3 } from '@/lib/s3';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { userId: partnerId } = await params;

    await prisma.message.updateMany({
      where: { senderId: partnerId, receiverId: session.userId, isRead: false },
      data: { isRead: true },
    });

    const [partner, messages] = await Promise.all([
      prisma.user.findUnique({
        where: { id: partnerId },
        select: { id: true, name: true, username: true, avatarUrl: true, city: true },
      }),
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: session.userId },
          ],
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return NextResponse.json({ partner, messages });
  } catch (error) {
    console.error('Chat history error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки сообщений' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { userId: partnerId } = await params;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const audioFile = formData.get('audio') as File | null;
      const videoFile = formData.get('video') as File | null;

      let audioUrl: string | null = null;
      let videoUrl: string | null = null;

      if (audioFile && audioFile.size > 0) {
        audioUrl = await uploadFileToS3(audioFile, 'chat');
      }
      if (videoFile && videoFile.size > 0) {
        videoUrl = await uploadFileToS3(videoFile, 'chat');
      }

      if (!audioUrl && !videoUrl) {
        return NextResponse.json({ error: 'Медиафайл не передан' }, { status: 400 });
      }

      const message = await prisma.message.create({
        data: {
          audioUrl,
          videoUrl,
          senderId: session.userId,
          receiverId: partnerId,
        },
      });

      return NextResponse.json({ message }, { status: 201 });
    }

    const body = await req.json();
    const text = String(body.text || '').trim();

    if (!text) {
      return NextResponse.json({ error: 'Сообщение пустое' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        text,
        senderId: session.userId,
        receiverId: partnerId,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Ошибка отправки сообщения' }, { status: 500 });
  }
}
