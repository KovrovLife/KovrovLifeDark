import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ru-1',
  endpoint: process.env.S3_ENDPOINT || 'https://twcstorage.ru',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export type S3Folder = 'avatars' | 'covers' | 'communities' | 'posts' | 'photos' | 'stories' | 'reels' | 'music' | 'chat';

export async function uploadFileToS3(file: File, folder: S3Folder): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const fileName = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const contentType = file.type || 'application/octet-stream';

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: fileName,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Timeweb S3 [${uploadRes.status}]: ${errText || uploadRes.statusText}`);
  }

  const publicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL?.replace(/\/$/, '');
  return `${publicUrl}/${fileName}`;
}
