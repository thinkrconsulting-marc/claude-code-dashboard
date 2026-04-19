// YouTube Data API v3 service
const YT_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YTVideoItem {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount?: number;
  duration?: string;
}

export interface YTChannelInfo {
  channelId: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  thumbnailUrl: string;
}

// Parse ISO 8601 duration (PT1H2M3S) to readable format
function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = match[1] ? `${match[1]}:` : '';
  const m = match[2] ? match[2].padStart(h ? 2 : 1, '0') : '0';
  const s = match[3] ? match[3].padStart(2, '0') : '00';
  return `${h}${m}:${s}`;
}

// Search for videos on a channel related to Claude Code
export async function searchChannelVideos(
  channelId: string,
  maxResults = 25,
  pageToken?: string
): Promise<{ items: YTVideoItem[]; nextPageToken?: string }> {
  const queries = ['claude code', 'claude ai agent', 'anthropic claude'];
  const allItems: YTVideoItem[] = [];
  const seenIds = new Set<string>();

  for (const q of queries) {
    const params = new URLSearchParams({
      part: 'snippet',
      channelId,
      q,
      type: 'video',
      maxResults: String(Math.min(maxResults, 50)),
      order: 'date',
      key: YT_API_KEY,
    });
    if (pageToken) params.set('pageToken', pageToken);

    try {
      const res = await fetch(`${YT_BASE}/search?${params}`);
      if (!res.ok) continue;
      const data = await res.json();

      for (const item of data?.items ?? []) {
        const vid = item?.id?.videoId;
        if (!vid || seenIds.has(vid)) continue;
        seenIds.add(vid);
        allItems.push({
          videoId: vid,
          title: item.snippet?.title ?? '',
          description: item.snippet?.description ?? '',
          channelTitle: item.snippet?.channelTitle ?? '',
          channelId: item.snippet?.channelId ?? channelId,
          publishedAt: item.snippet?.publishedAt ?? '',
          thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? '',
        });
      }
    } catch (e) {
      console.error(`YT search error for channel ${channelId}, query "${q}":`, e);
    }
  }

  return { items: allItems.slice(0, maxResults) };
}

// Search globally for Claude Code videos
export async function searchGlobalVideos(
  query = 'claude code',
  maxResults = 25,
  publishedAfter?: string
): Promise<YTVideoItem[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(Math.min(maxResults, 50)),
    order: 'date',
    relevanceLanguage: 'en',
    key: YT_API_KEY,
  });
  if (publishedAfter) params.set('publishedAfter', publishedAfter);

  try {
    const res = await fetch(`${YT_BASE}/search?${params}`);
    if (!res.ok) {
      console.error('YT global search error:', res.status, await res.text());
      return [];
    }
    const data = await res.json();
    return (data?.items ?? []).map((item: any) => ({
      videoId: item?.id?.videoId ?? '',
      title: item.snippet?.title ?? '',
      description: item.snippet?.description ?? '',
      channelTitle: item.snippet?.channelTitle ?? '',
      channelId: item.snippet?.channelId ?? '',
      publishedAt: item.snippet?.publishedAt ?? '',
      thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? '',
    })).filter((v: YTVideoItem) => v.videoId);
  } catch (e) {
    console.error('YT global search error:', e);
    return [];
  }
}

// Get video details (view count, duration)
export async function getVideoDetails(videoIds: string[]): Promise<Map<string, { viewCount: number; duration: string }>> {
  const result = new Map<string, { viewCount: number; duration: string }>();
  // YouTube API allows max 50 IDs per request
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: 'contentDetails,statistics',
      id: batch.join(','),
      key: YT_API_KEY,
    });
    try {
      const res = await fetch(`${YT_BASE}/videos?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of data?.items ?? []) {
        result.set(item.id, {
          viewCount: parseInt(item.statistics?.viewCount ?? '0', 10),
          duration: parseDuration(item.contentDetails?.duration ?? ''),
        });
      }
    } catch (e) {
      console.error('YT video details error:', e);
    }
  }
  return result;
}

// Resolve channel handle to channel ID
export async function resolveChannelHandle(handle: string): Promise<YTChannelInfo | null> {
  // Remove @ prefix if present
  const cleanHandle = handle.replace(/^@/, '');

  // Try forHandle parameter
  const params = new URLSearchParams({
    part: 'snippet,statistics',
    forHandle: cleanHandle,
    key: YT_API_KEY,
  });

  try {
    const res = await fetch(`${YT_BASE}/channels?${params}`);
    if (!res.ok) {
      console.error(`YT channel resolve error for ${handle}:`, res.status);
      return null;
    }
    const data = await res.json();
    const ch = data?.items?.[0];
    if (!ch) {
      // Fallback: search for the channel
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: cleanHandle,
        type: 'channel',
        maxResults: '1',
        key: YT_API_KEY,
      });
      const searchRes = await fetch(`${YT_BASE}/search?${searchParams}`);
      if (!searchRes.ok) return null;
      const searchData = await searchRes.json();
      const searchCh = searchData?.items?.[0];
      if (!searchCh) return null;

      // Get full channel details
      const detailParams = new URLSearchParams({
        part: 'snippet,statistics',
        id: searchCh.id?.channelId ?? searchCh.snippet?.channelId ?? '',
        key: YT_API_KEY,
      });
      const detailRes = await fetch(`${YT_BASE}/channels?${detailParams}`);
      if (!detailRes.ok) return null;
      const detailData = await detailRes.json();
      const detailCh = detailData?.items?.[0];
      if (!detailCh) return null;

      return {
        channelId: detailCh.id,
        title: detailCh.snippet?.title ?? cleanHandle,
        description: detailCh.snippet?.description ?? '',
        subscriberCount: parseInt(detailCh.statistics?.subscriberCount ?? '0', 10),
        videoCount: parseInt(detailCh.statistics?.videoCount ?? '0', 10),
        thumbnailUrl: detailCh.snippet?.thumbnails?.default?.url ?? '',
      };
    }

    return {
      channelId: ch.id,
      title: ch.snippet?.title ?? cleanHandle,
      description: ch.snippet?.description ?? '',
      subscriberCount: parseInt(ch.statistics?.subscriberCount ?? '0', 10),
      videoCount: parseInt(ch.statistics?.videoCount ?? '0', 10),
      thumbnailUrl: ch.snippet?.thumbnails?.default?.url ?? '',
    };
  } catch (e) {
    console.error(`YT channel resolve error for ${handle}:`, e);
    return null;
  }
}

// Get single video by ID from YouTube
export async function getVideoById(videoId: string): Promise<YTVideoItem | null> {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: videoId,
    key: YT_API_KEY,
  });
  try {
    const res = await fetch(`${YT_BASE}/videos?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.items?.[0];
    if (!item) return null;
    return {
      videoId: item.id,
      title: item.snippet?.title ?? '',
      description: item.snippet?.description ?? '',
      channelTitle: item.snippet?.channelTitle ?? '',
      channelId: item.snippet?.channelId ?? '',
      publishedAt: item.snippet?.publishedAt ?? '',
      thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? '',
      viewCount: parseInt(item.statistics?.viewCount ?? '0', 10),
      duration: parseDuration(item.contentDetails?.duration ?? ''),
    };
  } catch {
    return null;
  }
}
