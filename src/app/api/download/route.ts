import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const formatId = searchParams.get("format_id") || "best";

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Validate YouTube URL
  const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
  if (!youtubeRegex.test(url)) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  try {
    const ytDlpPath = "/tmp/yt-dlp";

    // Get title first for filename
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFileAsync = promisify(execFile);
    
    let title = "video";
    try {
      const { stdout } = await execFileAsync(ytDlpPath, ["--get-title", "--no-playlist", url]);
      title = stdout.trim().replace(/[<>:"/\\|?*]/g, "_");
    } catch (e) {
      console.log("Could not get title, using default");
    }

    // Stream the video
    const process = spawn(ytDlpPath, [
      "-f", formatId,
      "-o", "-",
      "--no-playlist",
      url
    ]);

    const chunks: Buffer[] = [];

    process.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    process.stderr.on("data", (data: Buffer) => {
      // yt-dlp outputs progress to stderr
      console.log(data.toString());
    });

    return new Promise<NextResponse>((resolve, reject) => {
      process.on("close", (code) => {
        if (code === 0) {
          const buffer = Buffer.concat(chunks);
          const response = new NextResponse(buffer, {
            headers: {
              "Content-Type": "video/mp4",
              "Content-Disposition": `attachment; filename="${title}.mp4"`,
              "Content-Length": buffer.length.toString(),
            },
          });
          resolve(response);
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });

      process.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error downloading video:", error);
    return NextResponse.json(
      { error: "Failed to download video" },
      { status: 500 }
    );
  }
}
