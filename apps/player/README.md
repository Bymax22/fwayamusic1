# Fwaya Advanced Player

A feature-rich, DRM-protected music player with advanced visualizations and seamless file integration.

## Features

- **DRM Protection**: AES-256-GCM encrypted playback with device binding
- **Advanced Visualizer**: Real-time audio frequency visualization with WebGL
- **File Association**: Automatic opening when .fwaya files are clicked
- **PWA Support**: Installable web app with offline capabilities
- **Cross-Platform**: Works on desktop and mobile browsers
- **Drag & Drop**: Easy file loading interface

## Architecture

```
apps/player/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/         # API routes (license validation proxy)
│   │   ├── globals.css  # Tailwind styles
│   │   └── page.tsx     # Main player page
│   └── components/      # React components
│       ├── AdvancedPlayer.tsx    # Main player component
│       ├── AudioVisualizer.tsx   # WebGL visualizer
│       └── FileUpload.tsx        # Drag-drop file handler
├── public/
│   └── manifest.json    # PWA manifest
└── package.json
```

## Deployment

### 1. Environment Variables

Create a `.env.local` file:

```env
BACKEND_URL=https://your-backend.vercel.app
PLAYER_URL=https://your-player.vercel.app
```

### 2. Build and Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start development server
npm run dev

# Deploy to Vercel
vercel --prod
```

### 3. File Association Setup

For automatic file opening, ensure your PWA manifest includes:

```json
{
  "file_handlers": [
    {
      "action": "/player",
      "accept": {
        "application/fwaya": [".fwaya"]
      }
    }
  ]
}
```

## Usage Flow

1. **User downloads .fwaya file** from Fwaya website
2. **Clicks file on device** → Browser opens player URL
3. **Player validates license** with backend
4. **Decrypts and plays** track with visualizer
5. **Device binding enforced** - only works on licensed device

## Browser Support

- **Chrome/Edge**: Full PWA + File Handling API support
- **Firefox/Safari**: Manual file upload (drag-drop)
- **Mobile**: PWA installation with file association

## Security

- All decryption happens client-side
- License validation required before playback
- Encrypted data never stored unencrypted
- Device fingerprinting prevents sharing