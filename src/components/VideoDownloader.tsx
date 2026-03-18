"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardPaste, Download, Loader2, Music4, Video, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { VideoInfo } from "@/lib/yt-dlp";

function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hrs > 0
    ? `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatFilesize(bytes: number | null) {
  if (!bytes) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[index]}`;
}

export default function VideoDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const formats = useMemo(() => videoInfo?.formats ?? [], [videoInfo]);
  const selected = useMemo(
    () => formats.find((format) => format.format_id === selectedFormat) ?? null,
    [formats, selectedFormat]
  );

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
      setError("");
    } catch {
      setError("Couldn’t access your clipboard. Paste the link manually.");
    }
  }

  async function handleFetchInfo() {
    if (!url.trim()) {
      setError("Paste a YouTube URL first.");
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
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch video details.");
      setVideoInfo(data);
      if (data.formats?.length) {
        setSelectedFormat(data.formats[0].format_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch video details.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!videoInfo || !selectedFormat) return;
    setDownloading(true);
    setError("");

    const downloadUrl = `/api/download?url=${encodeURIComponent(url.trim())}&format_id=${encodeURIComponent(selectedFormat)}`;
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => setDownloading(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/15 p-3 text-primary">
              <Youtube className="size-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">YT DLX</p>
              <p className="text-sm text-muted-foreground">Modern YouTube downloader UI built on Next.js + yt-dlp</p>
            </div>
          </div>
          <a
            href="https://github.com/arthurian-ai/yt-dlx"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            View repo
          </a>
        </header>

        <main className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-primary">Download cleanly</p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Paste a YouTube link and grab a usable download format.</h1>
                <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  YT DLX surfaces the most practical progressive formats first, plus a high-quality audio-only option.
                </p>
              </div>

              <Card className="border-border/70 bg-card/90">
                <CardHeader>
                  <CardTitle>Video URL</CardTitle>
                  <CardDescription>Use a standard youtube.com or youtu.be link.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && handleFetchInfo()}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="h-12 flex-1"
                    />
                    <Button type="button" variant="outline" className="h-12" onClick={handlePaste}>
                      <ClipboardPaste className="mr-2 size-4" />
                      Paste
                    </Button>
                    <Button type="button" className="h-12" onClick={handleFetchInfo} disabled={loading}>
                      {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Youtube className="mr-2 size-4" />}
                      Analyze
                    </Button>
                  </div>

                  {error ? (
                    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      <span>{error}</span>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Notes</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>Formats depend on what yt-dlp can access for the pasted video.</li>
                      <li>Some private, age-restricted, or region-locked videos may fail.</li>
                      <li>Download content only when you have the right to do so.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {videoInfo ? (
              <Card className="border-border/70 bg-card/90">
                <CardHeader>
                  <CardTitle>Available download options</CardTitle>
                  <CardDescription>Select one format, then start the download.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      className="aspect-video w-full rounded-2xl border border-border/60 object-cover sm:w-72"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold leading-tight">{videoInfo.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{videoInfo.channel}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full border border-border/60 px-3 py-1 text-muted-foreground">
                          {formatDuration(videoInfo.duration)}
                        </span>
                        {videoInfo.webpage_url ? (
                          <span className="rounded-full border border-border/60 px-3 py-1 text-muted-foreground">Ready for download</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat} className="grid gap-3">
                    {formats.map((format) => (
                      <Label
                        key={format.format_id}
                        htmlFor={format.format_id}
                        className="cursor-pointer rounded-2xl border border-border/70 bg-background/70 p-4 transition hover:border-primary/60 hover:bg-primary/5"
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem id={format.format_id} value={format.format_id} className="mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">{format.label}</span>
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                {format.hasVideo ? <Video className="mr-1 inline size-3" /> : <Music4 className="mr-1 inline size-3" />}
                                {format.hasVideo ? "Video" : "Audio"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span>Resolution: {format.resolution}</span>
                              <span>Type: {format.ext.toUpperCase()}</span>
                              <span>Size: {formatFilesize(format.filesize)}</span>
                            </div>
                          </div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>

                  <Button type="button" className="h-12 w-full text-base" onClick={handleDownload} disabled={!selected || downloading}>
                    {downloading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
                    {downloading ? "Starting download…" : selected ? `Download ${selected.label}` : "Select a format"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-border/70 bg-card/60">
                <CardHeader>
                  <CardTitle>No video loaded yet</CardTitle>
                  <CardDescription>Analyze a URL to see thumbnail, metadata, and curated format options.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  The current implementation prefers progressive formats that already include audio, because they download more reliably in a simple browser workflow.
                </CardContent>
              </Card>
            )}
          </section>

          <aside className="space-y-6">
            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle>What changed</CardTitle>
                <CardDescription>This version is meant to be practical to run locally.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>Backend resolves yt-dlp from an env var, local bin folder, or PATH instead of relying on a temp path.</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>Downloads stream directly from yt-dlp instead of buffering the whole file in memory first.</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>The UI now prioritizes the most usable formats and makes local setup clearer.</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle>Running it yourself</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. Install dependencies with <code className="rounded bg-background px-1 py-0.5">npm install</code>.</p>
                <p>2. Install yt-dlp and put it on PATH, or set <code className="rounded bg-background px-1 py-0.5">YT_DLP_BIN</code>.</p>
                <p>3. Start the app with <code className="rounded bg-background px-1 py-0.5">npm run dev</code>.</p>
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>
    </div>
  );
}
