import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { webrtcService } from '../services/webrtc';
import { meetingAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Meeting } from '../../../shared/types';

const MeetingRoomPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (!meetingId) return;

    loadMeeting();
    initializeWebRTC();

    return () => {
      webrtcService.disconnect();
    };
  }, [meetingId]);

  const loadMeeting = async () => {
    try {
      const response = await meetingAPI.getById(meetingId!);
      setMeeting(response.data.meeting);
      
      if (response.data.meeting.status === 'scheduled') {
        await meetingAPI.start(meetingId!);
      }
    } catch (error) {
      console.error('Failed to load meeting:', error);
    }
  };

  const initializeWebRTC = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const socket = webrtcService.connect(token);

      const stream = await webrtcService.getLocalStream(true, true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const participantId = `${user?.id}-${Date.now()}`;
      webrtcService.joinMeeting(meetingId!, participantId, user?.username || 'Guest');

      socket?.on('participant-joined', async (participant: any) => {
        setParticipants((prev) => [...prev, participant]);

        const pc = await webrtcService.createPeerConnection(
          participant.id,
          (stream) => {
            console.log('Received remote stream');
          }
        );

        await webrtcService.createOffer(participant.id);
      });

      socket?.on('participant-left', (participantId: string) => {
        setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      });

      socket?.on('webrtc-offer', async (data: any) => {
        const pc = await webrtcService.createPeerConnection(
          data.from,
          (stream) => {
            console.log('Received remote stream from offer');
          }
        );

        await webrtcService.handleOffer(data.from, data.signal);
      });

      socket?.on('webrtc-answer', async (data: any) => {
        await webrtcService.handleAnswer(data.from, data.signal);
      });

      socket?.on('webrtc-ice-candidate', async (data: any) => {
        await webrtcService.handleIceCandidate(data.from, data.candidate);
      });

      socket?.on('new-message', (message: any) => {
        setMessages((prev) => [...prev, message]);
      });
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
    }
  };

  const toggleAudio = () => {
    webrtcService.toggleAudio(!isAudioEnabled);
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleVideo = () => {
    webrtcService.toggleVideo(!isVideoEnabled);
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      webrtcService.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await webrtcService.getScreenStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Failed to share screen:', error);
      }
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const message = {
      meetingId: meetingId!,
      senderId: user?.id,
      senderName: user?.username || 'Guest',
      content: messageInput,
      type: 'text'
    };

    webrtcService.sendMessage(message);
    setMessages((prev) => [...prev, { ...message, timestamp: new Date() }]);
    setMessageInput('');
  };

  const leaveMeeting = async () => {
    try {
      await meetingAPI.end(meetingId!);
      webrtcService.disconnect();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to leave meeting:', error);
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a' }}>
      <header style={{
        backgroundColor: '#2c2c2c',
        padding: '15px 20px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2>{meeting?.title || 'Meeting Room'}</h2>
        <button
          onClick={leaveMeeting}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Leave Meeting
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                You {isScreenSharing ? '(Screen)' : ''}
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#2c2c2c',
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            gap: '15px'
          }}>
            <button
              onClick={toggleAudio}
              style={{
                padding: '12px 20px',
                backgroundColor: isAudioEnabled ? '#4CAF50' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isAudioEnabled ? '🎤 Mute' : '🎤 Unmute'}
            </button>
            <button
              onClick={toggleVideo}
              style={{
                padding: '12px 20px',
                backgroundColor: isVideoEnabled ? '#4CAF50' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isVideoEnabled ? '📹 Stop Video' : '📹 Start Video'}
            </button>
            <button
              onClick={toggleScreenShare}
              style={{
                padding: '12px 20px',
                backgroundColor: isScreenSharing ? '#FFC107' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isScreenSharing ? '🖥️ Stop Sharing' : '🖥️ Share Screen'}
            </button>
          </div>
        </div>

        <div style={{
          width: '300px',
          backgroundColor: '#2c2c2c',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #444', color: 'white' }}>
            <h3>Chat</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '10px', color: 'white' }}>
                <div style={{ fontSize: '12px', color: '#999' }}>{msg.senderName}</div>
                <div style={{ marginTop: '2px' }}>{msg.content}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '15px', borderTop: '1px solid #444', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #555',
                borderRadius: '4px',
                backgroundColor: '#1a1a1a',
                color: 'white'
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoomPage;
