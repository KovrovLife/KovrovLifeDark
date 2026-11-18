import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: session.userId }, { receiverId: session.userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    const dialogsMap = new Map();

    for (const msg of messages) {
      const isMine = msg.senderId === session.userId;
      const partner = isMine ? msg.receiver : msg.sender;

      const previewText =
        msg.text ||
        (msg.audioUrl ? '🎤 Голосовое сообщение' : msg.videoUrl ? '🎥 Видеокружочек' : '');

      if (!dialogsMap.has(partner.id)) {
        dialogsMap.set(partner.id, {
          partner,
          lastMessage: { text: previewText, createdAt: msg.createdAt, isMine },
          unreadCount: !isMine && !msg.isRead ? 1 : 0,
        });
      } else if (!isMine && !msg.isRead) {
        dialogsMap.get(partner.id).unreadCount += 1;
      }
    }

    return NextResponse.json({ dialogs: Array.from(dialogsMap.values()) });
  } catch (error) {
    console.error('Dialogs error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки диалогов' }, { status: 500 });
  }
}
