export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL verplicht' }, { status: 400 });

    // Parse GitHub URL
    const match = String(url).match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
    if (!match) return NextResponse.json({ error: 'Ongeldige GitHub URL' }, { status: 400 });

    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, '');

    // Fetch repo info
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'ClaudeCodeKennisbank' };
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;

    const [repoRes, readmeRes] = await Promise.allSettled([
      fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repoName}/readme`, { headers }),
    ]);

    let repoData: any = null;
    let readmeContent = '';

    if (repoRes.status === 'fulfilled' && repoRes.value?.ok) {
      repoData = await repoRes.value.json();
    }

    if (readmeRes.status === 'fulfilled' && readmeRes.value?.ok) {
      const readmeData = await readmeRes.value.json();
      if (readmeData?.content) {
        readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      }
    }

    return NextResponse.json({
      name: repoData?.name ?? repoName,
      description: repoData?.description ?? null,
      stars: repoData?.stargazers_count ?? null,
      license: repoData?.license?.spdx_id ?? null,
      language: repoData?.language ?? null,
      owner: owner,
      readmeContent: readmeContent?.slice?.(0, 30000) ?? '',
      topics: repoData?.topics ?? [],
      url: `https://github.com/${owner}/${repoName}`,
    });
  } catch (error: any) {
    console.error('GitHub info error:', error);
    return NextResponse.json({ error: 'Fout bij ophalen GitHub info' }, { status: 500 });
  }
}
