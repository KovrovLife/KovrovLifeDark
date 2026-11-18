import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadFileToS3 } from '@/lib/s3';

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const formData = await req.formData();
    const name = String(formData.get('name') || '').trim();
    const bio = String(formData.get('bio') || '').trim();
    const city = String(formData.get('city') || '').trim();
    const avatarFile = formData.get('avatar') as File | null;
    const coverFile = formData.get('cover') as File | null;

    if (!name) {
      return NextResponse.json({ error: 'Имя не может быть пустым' }, { status: 400 });
    }

    let avatarUrl: string | undefined = undefined;
    if (avatarFile && avatarFile.size > 0) {
      avatarUrl = await uploadFileToS3(avatarFile, 'avatars');
      await prisma.photo.create({
        data: {
          imageUrl: avatarUrl,
          caption: 'Обновил(а) фотографию профиля',
          ownerId: session.userId,
        },
      });
    }

    let coverUrl: string | undefined = undefined;
    if (coverFile && coverFile.size > 0) {
      coverUrl = await uploadFileToS3(coverFile, 'covers');
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name,
        bio: bio || null,
        city: city || null,
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(coverUrl ? { coverUrl } : {}),
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Ошибка обновления профиля' }, { status: 500 });
  }
}
