import { NextRequest, NextResponse } from "next/server";
import {
  extToContentType,
  isYoutubeUrl,
  nodeStreamToWeb,
  probeInfo,
  sanitizeFilename,
  spawnDownload,
} from "@/lib/yt-dlp";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim() || "";
  const formatId = searchParams.get("format_id")?.trim() || "best";

  if (!url) {
    return NextResponse.json({ error: "Missing url query parameter." }, { status: 400 });
  }

  if (!isYoutubeUrl(url)) {
    return NextResponse.json({ error: "Invalid YouTube URL." }, { status: 400 });
  }

  try {
    const info = await probeInfo(url);
    const selected = info.formats.find((format) => format.format_id === formatId);

    if (!selected) {
      return NextResponse.json({ error: "Selected format is no longer available." }, { status: 404 });
    }

    const proc = await spawnDownload(url, formatId);
    let stderr = "";

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const stream = nodeStreamToWeb(proc.stdout);
    const filename = `${sanitizeFilename(info.title)}.${selected.ext}`;

    proc.once("error", (error) => {
      console.error("[api/download] process error", error);
    });

    proc.once("close", (code) => {
      if (code && code !== 0) {
        console.error("[api/download] yt-dlp exited", { code, stderr: stderr.slice(0, 500) });
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": extToContentType(selected.ext, !selected.hasVideo),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start download.";
    console.error("[api/download]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
