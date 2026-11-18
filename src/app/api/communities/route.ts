import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { uploadFileToS3 } from '@/lib/s3';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const query = String(searchParams.get('q') || '').trim();

    const communities = await prisma.community.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true, posts: true } },
        members: session
          ? { where: { userId: session.userId }, select: { id: true } }
          : false,
      },
    });

    const formatted = communities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      avatarUrl: c.avatarUrl,
      ownerId: c.ownerId,
      membersCount: c._count.members,
      postsCount: c._count.posts,
      isMember: Array.isArray(c.members) ? c.members.length > 0 : false,
    }));

    return NextResponse.json({ communities: formatted });
  } catch (error) {
    console.error('Get communities error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки сообществ' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const formData = await req.formData();
    const name = String(formData.get('name') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const avatarFile = formData.get('avatar') as File | null;

    if (!name) {
      return NextResponse.json({ error: 'Введите название сообщества' }, { status: 400 });
    }

    let avatarUrl: string | null = null;
    if (avatarFile && avatarFile.size > 0) {
      avatarUrl = await uploadFileToS3(avatarFile, 'communities');
    }

    const slug = `club_${Date.now().toString(36)}`;

    const community = await prisma.community.create({
      data: {
        name,
        slug,
        description: description || null,
        avatarUrl,
        ownerId: session.userId,
        members: {
          create: { userId: session.userId },
        },
      },
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (error) {
    console.error('Create community error:', error);
    return NextResponse.json({ error: 'Ошибка создания сообщества' }, { status: 500 });
  }
}
