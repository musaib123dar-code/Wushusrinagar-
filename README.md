# Video Conferencing Application

A comprehensive Zoom-like video conferencing application supporting web, iOS, Android, and desktop platforms.

## Features

- **Video/Audio Conferencing**: Real-time peer-to-peer and group calling with WebRTC
- **Screen Sharing**: Share screen during meetings
- **Chat/Messaging**: Real-time chat during meetings and persistent messaging
- **Recording**: Record meetings to cloud storage
- **Meeting Scheduling**: Schedule meetings with calendar integration and reminders
- **User Authentication**: Secure signup, login, and profile management

## Architecture

- **Frontend**: React (web), React Native (mobile), Electron (desktop)
- **Backend**: Node.js with Express.js
- **Real-time Communication**: WebRTC for media, Socket.io for signaling/chat
- **Database**: PostgreSQL for users, meetings, messages, recordings metadata
- **Authentication**: JWT-based auth with refresh tokens
- **Storage**: Cloud storage for recordings and media

## Project Structure

```
video-conferencing-app/
├── backend/                 # Node.js + Express.js backend
├── web-client/             # React web application
├── mobile-client/          # React Native mobile app
├── desktop-client/         # Electron desktop app
├── shared/                 # Shared types and utilities
├── docker/                 # Docker configurations
├── docs/                   # Documentation
└── deployment/             # CI/CD and deployment configs
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Docker (optional)

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Web Client Setup

```bash
cd web-client
npm install
npm run dev
```

### Mobile Client Setup

```bash
cd mobile-client
npm install
npm start
```

### Desktop Client Setup

```bash
cd desktop-client
npm install
npm run dev
```

## API Documentation

The backend provides RESTful APIs and WebSocket connections for real-time features. See [docs/API.md](docs/API.md) for detailed API documentation.

## Contributing

Please read [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for contribution guidelines.

## License

MIT License