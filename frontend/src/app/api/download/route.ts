import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = req.nextUrl.searchParams.get('url');
  const name = req.nextUrl.searchParams.get('name') ?? 'download';

  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  const r2PublicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
  if (!r2PublicUrl || !url.startsWith(r2PublicUrl)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
