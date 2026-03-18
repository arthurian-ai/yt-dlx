import { NextRequest, NextResponse } from "next/server";
import { isYoutubeUrl, probeInfo } from "@/lib/yt-dlp";

export type { VideoFormat, VideoInfo } from "@/lib/yt-dlp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json({ error: "Paste a YouTube URL first." }, { status: 400 });
    }

    if (!isYoutubeUrl(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL. Use a youtube.com or youtu.be link." },
        { status: 400 }
      );
    }

    const info = await probeInfo(url);

    if (!info.formats.length) {
      return NextResponse.json(
        { error: "No downloadable formats were found for this video." },
        { status: 422 }
      );
    }

    return NextResponse.json(info);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch video information.";
    console.error("[api/info]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
