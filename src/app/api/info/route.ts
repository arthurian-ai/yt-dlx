import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  filesize: number | null;
  format_note: string;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  upload_date: string;
  formats: VideoFormat[];
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(url)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const ytDlpPath = "/tmp/yt-dlp";
    
    // Get video info with all formats
    const { stdout } = await execFileAsync(ytDlpPath, [
      "--dump-json",
      "--no-download",
      "--no-playlist",
      url
    ]);

    const data = JSON.parse(stdout);

    // Filter and format available formats
    const formats: VideoFormat[] = data.formats
      ?.filter((f: any) => f.ext !== "mhtml" && f.url) // Filter out incomplete formats
      ?.map((f: any) => ({
        format_id: f.format_id,
        ext: f.ext,
        resolution: f.resolution || `${f.width}x${f.height}`,
        filesize: f.filesize || f.filesize_approx || null,
        format_note: f.format_note || ""
      }))
      || [];

    // Get the best formats for each quality
    const videoInfo: VideoInfo = {
      id: data.id,
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,
      channel: data.channel || data.uploader || "Unknown",
      upload_date: data.upload_date,
      formats
    };

    return NextResponse.json(videoInfo);
  } catch (error) {
    console.error("Error fetching video info:", error);
    return NextResponse.json(
      { error: "Failed to fetch video information" },
      { status: 500 }
    );
  }
}
