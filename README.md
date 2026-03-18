# YT DLX

A polished local-first YouTube downloader UI built with Next.js, Tailwind, and yt-dlp.

YT DLX gives you a cleaner browser workflow around `yt-dlp`: paste a YouTube URL, inspect a curated set of practical download formats, and trigger a direct streamed download from the server.

## What this project does

- Accepts `youtube.com` and `youtu.be` links
- Uses `yt-dlp` on the server to inspect available formats
- Shows a cleaner shortlist of useful progressive formats plus audio-only options
- Streams downloads directly instead of buffering the full file in memory first
- Provides a modern dark UI with clearer error, empty, and loading states

## Stack

- **Next.js 16** App Router
- **React 19**
- **Tailwind CSS v4**
- **shadcn/ui / Base UI primitives**
- **yt-dlp** for actual extraction and download handling

## Architecture

### Frontend
The main UI lives in:

- `src/components/VideoDownloader.tsx`

It handles:
- URL input and paste UX
- requesting video metadata from the backend
- rendering curated format choices
- triggering downloads

### Backend
API routes:

- `POST /api/info` → validate URL, probe metadata, return shaped formats
- `GET /api/download` → validate request and stream download output

Shared server helper:

- `src/lib/yt-dlp.ts`

That helper is responsible for:
- locating the `yt-dlp` binary
- probing metadata
- spawning download streams
- sanitizing filenames
- shaping raw format data into something the UI can present cleanly

## How yt-dlp is resolved

YT DLX looks for `yt-dlp` in this order:

1. `YT_DLP_BIN` environment variable
2. `./bin/yt-dlp` inside this repo
3. `yt-dlp` available on your system `PATH`

If none of those exist, the app returns a clear setup error.

## Prerequisites

- **Node.js 20+** recommended
- **npm**
- **yt-dlp** installed locally

## Installing yt-dlp

### Option A: install on PATH (recommended)

#### Linux / macOS
```bash
python3 -m pip install -U yt-dlp
```

Or download the standalone binary:
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

#### Verify
```bash
yt-dlp --version
```

### Option B: keep a repo-local binary

Create a local bin directory and drop the binary there:
```bash
mkdir -p bin
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o bin/yt-dlp
chmod +x bin/yt-dlp
```

### Option C: use an explicit environment variable

If your binary lives somewhere custom:
```bash
export YT_DLP_BIN=/absolute/path/to/yt-dlp
```

## Local development

### 1) Install dependencies
```bash
npm install
```

### 2) Make sure yt-dlp is available
Either:
```bash
yt-dlp --version
```

Or:
```bash
export YT_DLP_BIN=/absolute/path/to/yt-dlp
```

### 3) Start the dev server
```bash
npm run dev
```

Then open:
```bash
http://localhost:3000
```

## Production-ish local run

Build and run:

```bash
npm run lint
npm run build
npm start
```

## Exact commands Curtis can run

If `yt-dlp` is already installed globally:

```bash
cd /home/curtis/.openclaw/workspace-lancelot/projects/yt-downloader
npm install
npm run dev
```

If `yt-dlp` is not on PATH but you have a local binary:

```bash
cd /home/curtis/.openclaw/workspace-lancelot/projects/yt-downloader
export YT_DLP_BIN=/absolute/path/to/yt-dlp
npm install
npm run dev
```

To verify the production build:

```bash
cd /home/curtis/.openclaw/workspace-lancelot/projects/yt-downloader
npm run lint
npm run build
npm start
```

## Design choices

### Why a shared yt-dlp helper?
The earlier version hardcoded `/tmp/yt-dlp`, which is brittle and annoying to run locally. The helper centralizes binary resolution and makes setup much more realistic.

### Why stream downloads?
The previous download route buffered the entire file into memory before returning it. That works poorly for larger downloads. Streaming is simpler, safer, and more practical.

### Why only show curated formats?
Raw `yt-dlp` format lists are noisy. For a lightweight UI, progressive formats with both video and audio are usually the most useful. This version favors those first, then adds a strong audio-only option.

## Limitations

- This app currently prefers **progressive** formats for simplicity. It does not yet merge separate video/audio tracks on the server.
- Some videos may fail because of region locks, age restrictions, login requirements, or upstream YouTube changes.
- `yt-dlp` behavior can change as YouTube changes.
- This is intended as a local/self-hosted utility, not a public multi-user download service.

## Troubleshooting

### “yt-dlp not found”
Install `yt-dlp`, put it on PATH, or set:
```bash
export YT_DLP_BIN=/absolute/path/to/yt-dlp
```

### “Invalid YouTube URL”
Use a full `youtube.com/watch?...` or `youtu.be/...` link.

### Video info loads but some formats fail
That usually means YouTube changed the available formats or the selected format expired. Reload the video info and try again.

### Build works but downloads fail at runtime
Check whether the server process can execute `yt-dlp`:
```bash
yt-dlp --version
```

Or if using a custom binary:
```bash
$YT_DLP_BIN --version
```

## Validation

This project should be validated with:

```bash
npm run lint
npm run build
```

## Legal / usage note

Use this only for content you are allowed to download. Respect platform rules, copyright, and creator rights.
