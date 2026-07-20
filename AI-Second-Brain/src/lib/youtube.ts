import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

/**
 * 사용자의 YouTube 재생목록 변경사항을 확인합니다.
 * OAuth access_token을 사용하여 YouTube Data API v3에 접근합니다.
 */
export async function checkYouTubePlaylists(
  userId: string,
  accessToken: string
) {
  const youtube = google.youtube({
    version: "v3",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  try {
    // 사용자의 재생목록 목록 가져오기 (기본 재생목록 제외)
    const playlistsResponse = await youtube.playlists.list({
      part: ["snippet", "contentDetails"],
      mine: true,
      maxResults: 25,
    });

    const playlists = playlistsResponse.data.items || [];
    const newVideos: YouTubeVideoInfo[] = [];

    for (const playlist of playlists) {
      if (!playlist.id) continue;

      // 각 재생목록의 최신 영상 확인
      const itemsResponse = await youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId: playlist.id,
        maxResults: 5,
      });

      const items = itemsResponse.data.items || [];

      for (const item of items) {
        const videoId = item.contentDetails?.videoId;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // 이미 등록된 URL인지 확인
        const existing = await prisma.bookmark.findFirst({
          where: { userId, url: videoUrl },
        });

        if (!existing && videoId) {
          newVideos.push({
            videoId,
            url: videoUrl,
            title: item.snippet?.title || "제목 없음",
            description: item.snippet?.description || "",
            thumbnail:
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.default?.url ||
              "",
            playlistTitle: playlist.snippet?.title || "",
            publishedAt: item.snippet?.publishedAt || "",
          });
        }
      }
    }

    return newVideos;
  } catch (error) {
    console.error("YouTube API error:", error);
    return [];
  }
}

export interface YouTubeVideoInfo {
  videoId: string;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  playlistTitle: string;
  publishedAt: string;
}

/**
 * YouTube 영상의 자막을 가져옵니다.
 * (공개 자막만 접근 가능)
 */
export async function getVideoCaptions(
  videoId: string,
  accessToken: string
): Promise<string | null> {
  try {
    const youtube = google.youtube({
      version: "v3",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const captionsResponse = await youtube.captions.list({
      part: ["snippet"],
      videoId,
    });

    const captions = captionsResponse.data.items || [];
    // 한국어 또는 영어 자막 우선
    const caption = captions.find(
      (c) =>
        c.snippet?.language === "ko" || c.snippet?.language === "en"
    );

    if (!caption?.id) return null;

    // 자막 다운로드 (텍스트 형식)
    const captionResponse = await youtube.captions.download({
      id: caption.id,
      tfmt: "srt",
    });

    if (typeof captionResponse.data === "string") {
      // SRT 형식에서 텍스트만 추출
      return captionResponse.data
        .replace(/\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n/g, "")
        .replace(/\n\n/g, " ")
        .trim();
    }

    return null;
  } catch (error) {
    // 자막 접근 권한이 없는 경우 무시
    console.error("Caption fetch error:", error);
    return null;
  }
}
