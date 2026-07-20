/**
 * YouTube Data API v3를 사용하여 영상 메타데이터를 가져옵니다.
 * 스크래핑 대신 공식 API를 사용하여 YouTube ToS를 준수합니다.
 * 
 * 필요 환경변수: YOUTUBE_API_KEY (Google Cloud Console에서 발급)
 */

export interface YouTubeVideoMetadata {
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  tags: string[];
}

/**
 * YouTube URL에서 video ID를 추출합니다.
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * YouTube Data API v3로 영상 메타데이터를 가져옵니다.
 * API 키가 없으면 null을 반환합니다 (graceful fallback).
 */
export async function getYouTubeMetadata(videoId: string): Promise<YouTubeVideoMetadata | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY not set, skipping YouTube API call");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      console.error("YouTube API error:", response.status);
      return null;
    }

    const data = await response.json();
    const item = data.items?.[0];

    if (!item) return null;

    const snippet = item.snippet;
    return {
      title: snippet.title || "",
      description: (snippet.description || "").slice(0, 3000),
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
      channelTitle: snippet.channelTitle || "",
      publishedAt: snippet.publishedAt || "",
      tags: (snippet.tags || []).slice(0, 10),
    };
  } catch (error) {
    console.error("YouTube API fetch error:", error);
    return null;
  }
}

/**
 * URL이 YouTube 영상인지 확인합니다.
 */
export function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com/watch") || url.includes("youtu.be/") || url.includes("youtube.com/shorts/");
}
