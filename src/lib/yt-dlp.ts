import { access } from "fs/promises";
import { constants as fsConstants } from "fs";
import { Readable } from "stream";
import { execFile, spawn, type ChildProcessByStdio } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);
const YOUTUBE_URL_RE = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;

export interface VideoFormat {
  format_id: string;
  label: string;
  ext: string;
  resolution: string;
  height: number | null;
  filesize: number | null;
  format_note: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  upload_date: string;
  webpage_url?: string;
  formats: VideoFormat[];
}

interface RawFormat {
  format_id: string;
  ext: string;
  format_note?: string;
  resolution?: string;
  width?: number;
  height?: number;
  filesize?: number | null;
  filesize_approx?: number | null;
  vcodec?: string;
  acodec?: string;
  abr?: number;
  tbr?: number;
  fps?: number;
  protocol?: string;
  format?: string;
  url?: string;
}

let resolvedYtDlp: string | null = null;

async function isExecutable(candidate: string) {
  try {
    await access(candidate, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function findOnPath(binary: string) {
  const pathEntries = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  for (const entry of pathEntries) {
    const candidate = path.join(entry, binary);
    if (await isExecutable(candidate)) return candidate;
  }
  return null;
}

export function isYoutubeUrl(url: string) {
  return YOUTUBE_URL_RE.test(url.trim());
}

export function sanitizeFilename(name: string) {
  return (
    name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
      .replace(/\s+/g, " ")
      .replace(/\.+$/g, "")
      .trim()
      .slice(0, 180) || "video"
  );
}

export async function resolveYtDlp() {
  if (resolvedYtDlp) return resolvedYtDlp;

  const candidates = [
    process.env.YT_DLP_BIN,
    path.join(process.cwd(), "bin", "yt-dlp"),
    await findOnPath("yt-dlp"),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (await isExecutable(candidate)) {
      resolvedYtDlp = candidate;
      return candidate;
    }
  }

  throw new Error(
    "yt-dlp not found. Install yt-dlp and add it to PATH, or set YT_DLP_BIN=/absolute/path/to/yt-dlp."
  );
}

function classifyYtDlpError(raw: string) {
  const text = raw.trim();
  if (!text) return "yt-dlp failed unexpectedly.";
  if (/Video unavailable|video is unavailable/i.test(text)) return "This video is unavailable or private.";
  if (/Unsupported URL|not a valid URL/i.test(text)) return "Unsupported URL. Paste a youtube.com or youtu.be link.";
  if (/age-restricted|Sign in to confirm your age/i.test(text)) return "This video is age-restricted or requires sign-in.";
  if (/requested format not available/i.test(text)) return "That format is no longer available for this video.";
  return text.split("\n").find(Boolean)?.slice(0, 240) || "yt-dlp failed.";
}

function readableResolution(format: RawFormat) {
  if (format.height) return `${format.height}p`;
  if (format.resolution && format.resolution !== "audio only") return format.resolution;
  if (format.width && format.height) return `${format.width}×${format.height}`;
  return format.vcodec && format.vcodec !== "none" ? "video" : "audio";
}

function formatLabel(format: RawFormat) {
  const parts: string[] = [];
  const res = readableResolution(format);
  const upperExt = format.ext.toUpperCase();
  const hasVideo = !!format.vcodec && format.vcodec !== "none";
  const hasAudio = !!format.acodec && format.acodec !== "none";

  if (hasVideo && hasAudio) {
    parts.push(res, upperExt);
  } else if (hasVideo) {
    parts.push(`${res} video`, upperExt);
  } else if (hasAudio) {
    const bitrate = Math.round(format.abr || format.tbr || 0);
    parts.push("Audio only", upperExt);
    if (bitrate) parts.push(`${bitrate} kbps`);
  }

  if (format.fps && hasVideo) parts.push(`${Math.round(format.fps)} fps`);
  if (format.format_note) parts.push(format.format_note);

  return parts.join(" · ");
}

export function shapeFormats(rawFormats: RawFormat[]): VideoFormat[] {
  const filtered = rawFormats.filter((format) => format.url && format.ext !== "mhtml");

  const progressive = filtered
    .filter((f) => f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none")
    .sort((a, b) => (b.height || 0) - (a.height || 0) || (b.tbr || 0) - (a.tbr || 0));

  const audioOnly = filtered
    .filter((f) => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none")
    .sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0));

  const deduped: VideoFormat[] = [];
  const seen = new Set<string>();

  for (const format of progressive) {
    const key = `${format.height || format.resolution || "unknown"}-${format.ext}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      format_id: format.format_id,
      label: formatLabel(format),
      ext: format.ext,
      resolution: readableResolution(format),
      height: format.height ?? null,
      filesize: format.filesize ?? format.filesize_approx ?? null,
      format_note: format.format_note || "",
      hasVideo: true,
      hasAudio: true,
    });
  }

  for (const format of audioOnly.slice(0, 2)) {
    deduped.push({
      format_id: format.format_id,
      label: formatLabel(format),
      ext: format.ext,
      resolution: "audio only",
      height: null,
      filesize: format.filesize ?? format.filesize_approx ?? null,
      format_note: format.format_note || "",
      hasVideo: false,
      hasAudio: true,
    });
  }

  return deduped;
}

export async function probeInfo(url: string): Promise<VideoInfo> {
  const bin = await resolveYtDlp();

  try {
    const { stdout } = await execFileAsync(
      bin,
      ["--dump-single-json", "--no-playlist", "--no-warnings", url],
      { maxBuffer: 64 * 1024 * 1024 }
    );

    const data = JSON.parse(stdout);

    return {
      id: data.id,
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,
      channel: data.channel || data.uploader || "Unknown uploader",
      upload_date: data.upload_date,
      webpage_url: data.webpage_url,
      formats: shapeFormats(data.formats || []),
    };
  } catch (error) {
    const stderr =
      typeof error === "object" && error && "stderr" in error
        ? String((error as { stderr?: string | Buffer }).stderr || "")
        : "";
    throw new Error(classifyYtDlpError(stderr || (error as Error).message));
  }
}

export async function spawnDownload(url: string, formatId: string): Promise<ChildProcessByStdio<null, Readable, Readable>> {
  const bin = await resolveYtDlp();
  return spawn(bin, ["-f", formatId, "-o", "-", "--no-playlist", "--no-warnings", url], {
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function extToContentType(ext: string, hasAudioOnly = false) {
  if (hasAudioOnly) {
    switch (ext) {
      case "m4a":
        return "audio/mp4";
      case "opus":
        return "audio/ogg";
      case "webm":
        return "audio/webm";
      case "mp3":
      default:
        return "audio/mpeg";
    }
  }

  switch (ext) {
    case "webm":
      return "video/webm";
    case "mkv":
      return "video/x-matroska";
    default:
      return "video/mp4";
  }
}

export function nodeStreamToWeb(stream: Readable) {
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
}
