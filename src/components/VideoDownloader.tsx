"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  Search, 
  Loader2, 
  Youtube, 
  AlertCircle,
  X
} from "lucide-react";

interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  filesize: number | null;
  format_note: string;
}

interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  upload_date: string;
  formats: VideoFormat[];
}

function formatFilesize(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
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

export default function VideoDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleFetchInfo = async () => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setVideoInfo(null);
    setSelectedFormat("");

    try {
      const response = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch video info");
      }

      setVideoInfo(data);
      
      // Auto-select best quality video
      const bestFormat = data.formats.find(
        (f: VideoFormat) => f.ext === "mp4" && f.resolution.includes("1080")
      ) || data.formats.find(
        (f: VideoFormat) => f.ext === "mp4" && f.resolution.includes("720")
      ) || data.formats[0];
      
      if (bestFormat) {
        setSelectedFormat(bestFormat.format_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo || !selectedFormat) return;

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&format_id=${selectedFormat}`;
      
      // Create a hidden link to trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${videoInfo.title}.mp4`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Simulate progress (since we can't track actual download progress easily)
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setDownloadProgress(Math.min(progress, 90));
        if (progress >= 90) {
          clearInterval(interval);
        }
      }, 500);

      // Reset after a delay
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
        clearInterval(interval);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleClear = () => {
    setUrl("");
    setVideoInfo(null);
    setSelectedFormat("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="w-8 h-8 text-[#ff0000]" />
            <span className="text-xl font-bold">YT DLX</span>
          </div>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero / URL Input */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">YouTube Video Downloader</h1>
          <p className="text-gray-400 mb-6">Download videos in high quality — fast & free</p>
          
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Paste YouTube URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetchInfo()}
                className="h-12 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 pr-10"
              />
              {url && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              onClick={handleFetchInfo}
              disabled={loading}
              className="h-12 bg-[#ff0000] hover:bg-[#cc0000] text-white px-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Fetch
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Video Info */}
        {videoInfo && (
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] max-w-2xl mx-auto">
            <CardHeader className="pb-4">
              <div className="flex gap-4">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-48 h-27 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-white text-lg leading-tight mb-2 line-clamp-2">
                    {videoInfo.title}
                  </CardTitle>
                  <p className="text-gray-400 text-sm">{videoInfo.channel}</p>
                  <p className="text-gray-500 text-sm">
                    {formatDuration(videoInfo.duration)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Format Selection */}
              <div className="mb-4">
                <Label className="text-gray-300 mb-2 block">Select Quality</Label>
                <RadioGroup
                  value={selectedFormat}
                  onValueChange={setSelectedFormat}
                  className="grid grid-cols-2 gap-2"
                >
                  {videoInfo.formats.slice(0, 10).map((format) => (
                    <div
                      key={format.format_id}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedFormat === format.format_id
                          ? "border-[#3ea6ff] bg-[#3ea6ff]/10"
                          : "border-[#2a2a2a] hover:border-[#3ea6ff]/50"
                      }`}
                      onClick={() => setSelectedFormat(format.format_id)}
                    >
                      <RadioGroupItem
                        value={format.format_id}
                        id={format.format_id}
                        className="border-gray-500"
                      />
                      <Label
                        htmlFor={format.format_id}
                        className="flex-1 cursor-pointer text-sm text-gray-300"
                      >
                        {format.resolution} ({format.ext})
                      </Label>
                      <span className="text-xs text-gray-500">
                        {formatFilesize(format.filesize)}
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                disabled={downloading || !selectedFormat}
                className="w-full h-12 bg-[#ff0000] hover:bg-[#cc0000] text-white"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Video
                  </>
                )}
              </Button>

              {/* Progress Bar */}
              {downloading && (
                <Progress value={downloadProgress} className="mt-3 h-1" />
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>YT DLX — Built with Next.js & Tailwind CSS</p>
          <p className="mt-1">Powered by yt-dlp</p>
        </div>
      </footer>
    </div>
  );
}
