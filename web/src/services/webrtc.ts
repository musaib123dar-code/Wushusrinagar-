import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export class WebRTCService {
  private socket: Socket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;

  connect(token: string) {
    this.socket = io(SOCKET_URL, {
      auth: { token }
    });

    this.setupSocketListeners();
    return this.socket;
  }

  disconnect() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async getLocalStream(audio = true, video = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio,
        video: video ? { width: 1280, height: 720 } : false
      });
      return this.localStream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }

  async getScreenStream(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      return this.screenStream;
    } catch (error) {
      console.error('Error getting screen stream:', error);
      throw error;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
  }

  async createPeerConnection(
    participantId: string,
    onTrack: (stream: MediaStream) => void
  ): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.ontrack = (event) => {
      onTrack(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('webrtc-ice-candidate', {
          to: participantId,
          candidate: event.candidate
        });
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    this.peerConnections.set(participantId, pc);
    return pc;
  }

  async createOffer(participantId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnections.get(participantId);
    if (!pc) throw new Error('Peer connection not found');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (this.socket) {
      this.socket.emit('webrtc-offer', {
        to: participantId,
        signal: offer
      });
    }

    return offer;
  }

  async handleOffer(
    participantId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnections.get(participantId);
    if (!pc) throw new Error('Peer connection not found');

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (this.socket) {
      this.socket.emit('webrtc-answer', {
        to: participantId,
        signal: answer
      });
    }

    return answer;
  }

  async handleAnswer(participantId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(participantId);
    if (!pc) throw new Error('Peer connection not found');

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(participantId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(participantId);
    if (!pc) throw new Error('Peer connection not found');

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  joinMeeting(meetingId: string, participantId: string, displayName: string) {
    if (this.socket) {
      this.socket.emit('join-meeting', { meetingId, participantId, displayName });
    }
  }

  leaveMeeting(meetingId: string, participantId: string) {
    if (this.socket) {
      this.socket.emit('leave-meeting', { meetingId, participantId });
    }
  }

  sendMessage(message: any) {
    if (this.socket) {
      this.socket.emit('send-message', message);
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  getSocket() {
    return this.socket;
  }

  getLocalStream() {
    return this.localStream;
  }

  getScreenStream() {
    return this.screenStream;
  }
}

export const webrtcService = new WebRTCService();
