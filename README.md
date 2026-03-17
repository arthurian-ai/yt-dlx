# YT DLX - YouTube Video Downloader

A modern, sleek YouTube video downloader built with Next.js 16, Tailwind CSS, and shadcn/ui. Powered by yt-dlp for reliable video extraction.

![YT DLX Screenshot](https://via.placeholder.com/800x400?text=YT+DLX+Downloader)

## Features

- 🎥 Download YouTube videos in multiple quality formats
- 🖼️ Video preview with thumbnail, title, and duration
- 🎨 Modern dark UI inspired by YouTube
- ⚡ Fast and efficient streaming downloads
- 📱 Responsive design for mobile and desktop

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** Tailwind CSS v4 + shadcn/ui
- **Icons:** Lucide React
- **Backend:** Next.js API Routes
- **Download Engine:** yt-dlp

## Getting Started

### Prerequisites

- Node.js 18+
- yt-dlp (automatically downloaded on first run)

### Installation

```bash
# Clone the repository
git clone https://github.com/arthurian-ai/yt-dlx.git
cd yt-dlx

# Install dependencies
npm install

# Run the development server
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## API Endpoints

### Get Video Info

```bash
POST /api/info
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=..."
}
```

Response:
```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Video Title",
  "thumbnail": "https://...",
  "duration": 213,
  "channel": "Channel Name",
  "formats": [...]
}
```

### Download Video

```
GET /api/download?url=...&format_id=best
```

## Design Decisions

### Why These Technologies?

- **Next.js 16:** Latest version with App Router provides excellent developer experience and performance
- **Tailwind CSS v4:** Utility-first CSS with excellent dark mode support
- **shadcn/ui:** Accessible, customizable components built on Radix UI
- **yt-dlp:** The most reliable YouTube downloader, actively maintained

### UI/UX Choices

- **Dark theme:** Matches YouTube's aesthetic, easier on the eyes
- **YouTube Red (#ff0000):** Brand recognition
- **Accent Blue (#3ea6ff):** For interactive elements
- **Card-based layout:** Clear visual hierarchy

## License

MIT

## Disclaimer

This tool is for personal use only. Downloading videos may violate YouTube's Terms of Service. Use responsibly and respect copyright laws.
