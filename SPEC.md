# YouTube Video Downloader - Project Specification

## Project Overview
- **Project Name:** YT DLX (YouTube Downloader Express)
- **Type:** Modern web application for downloading YouTube videos
- **Core Functionality:** User pastes a YouTube URL, selects quality/format, downloads the video
- **Target Users:** Anyone wanting to save YouTube videos offline

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **UI Library:** shadcn/ui + Tailwind CSS
- **Icons:** Lucide React
- **Backend:** Next.js API Routes + yt-dlp
- **Language:** TypeScript

## UI/UX Specification

### Layout Structure
- **Header:** Logo, dark/light mode toggle
- **Hero Section:** Large input field for URL, paste button
- **Results Section:** Video info, quality selection, download button
- **Footer:** Credits, GitHub link

### Visual Design
- **Theme:** Dark mode primary (modern streaming aesthetic)
- **Color Palette:**
  - Background: #0f0f0f (YouTube-dark inspired)
  - Primary: #ff0000 (YouTube red)
  - Accent: #3ea6ff (YouTube blue)
  - Surface: #1a1a1a
  - Text: #ffffff / #aaaaaa
- **Typography:** Inter (sans-serif, clean)
- **Effects:** Subtle glow on input, smooth transitions

### Components
1. **URL Input:** Large, centered, with paste button and clear button
2. **Video Card:** Thumbnail, title, channel, duration
3. **Quality Selector:** Radio buttons for format/quality options
4. **Progress Bar:** Shows download progress
5. **Download Button:** Prominent CTA with loading state

### Responsive Breakpoints
- Mobile: < 640px (stacked layout)
- Tablet: 640px - 1024px
- Desktop: > 1024px (centered, max-width 800px)

## Functionality Specification

### Core Features
1. **URL Validation:** Check if valid YouTube URL
2. **Video Metadata Fetch:** Get title, thumbnail, duration, available formats
3. **Format Selection:** Choose quality (1080p, 720p, 480p, audio-only)
4. **Download:** Stream video to user via API
5. **Progress Tracking:** Show download progress

### User Flow
1. User pastes YouTube URL
2. Click "Fetch" → API calls yt-dlp to get video info
3. Display video thumbnail, title, available formats
4. User selects desired quality/format
5. Click "Download" → API streams file to browser

### API Endpoints
- `POST /api/info` - Get video metadata
- `GET /api/download` - Download video (streams file)

## Acceptance Criteria
- [ ] Clean, modern dark UI matching YouTube aesthetic
- [ ] URL validation with error feedback
- [ ] Video metadata displays correctly
- [ ] Format selection shows available options
- [ ] Download works and returns correct file
- [ ] Responsive on mobile
- [ ] Documentation in README

## Notes
- yt-dlp must be installed on server
- Use `--cookies-from-browser` flag if needed for age-restricted content
- Implement rate limiting to prevent abuse
