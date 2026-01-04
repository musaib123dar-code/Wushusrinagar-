import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authStore } from '../store/authStore';
import { socketService } from '../services/socketService';
import { apiService } from '../services/apiService';
import { Meeting, MeetingParticipant, Message } from '../types/shared';
import { Video, Mic, MicOff, VideoOff, Monitor, Phone, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const MeetingPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (meetingId) {
      loadMeeting();
      setupSocketListeners();
    }

    return () => {
      // Cleanup on unmount
      if (isJoined) {
        leaveMeeting();
      }
    };
  }, [meetingId]);

  const loadMeeting = async () => {
    try {
      if (!meetingId) return;
      
      const response = await apiService.getMeeting(meetingId);
      if (response.success) {
        setMeeting(response.data);
      } else {
        toast.error('Meeting not found');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to load meeting');
      navigate('/dashboard');
    }
  };

  const setupSocketListeners = () => {
    // Setup socket event listeners
    socketService.onParticipantJoined((data) => {
      setParticipants(prev => [...prev, data.participant]);
      toast.success(`${data.participant.user.firstName} joined the meeting`);
    });

    socketService.onParticipantLeft((data) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      toast('A participant left the meeting', { icon: 'ℹ️' });
    });

    socketService.onChatMessage((message) => {
      setMessages(prev => [...prev, message]);
    });
  };

  const joinMeeting = async () => {
    if (!meetingId || !user) return;

    try {
      const response = await apiService.joinMeeting(meetingId);
      if (response.success) {
        setIsJoined(true);
        const socketResponse = await socketService.joinMeeting(meetingId);
        if (socketResponse.success) {
          toast.success('Joined meeting successfully');
        }
      }
    } catch (error) {
      toast.error('Failed to join meeting');
    }
  };

  const leaveMeeting = async () => {
    if (!meetingId || !user) return;

    try {
      await apiService.leaveMeeting(meetingId);
      await socketService.leaveMeeting(meetingId);
      setIsJoined(false);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to leave meeting');
    }
  };

  const toggleVideo = async () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    
    if (meetingId) {
      try {
        await socketService.updateMediaState(meetingId, {
          userId: user?.id || '',
          isVideoEnabled: newState,
          isMuted: !isAudioEnabled,
          isScreenSharing: isScreenSharing
        });
      } catch (error) {
        toast.error('Failed to toggle video');
      }
    }
  };

  const toggleAudio = async () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    
    if (meetingId) {
      try {
        await socketService.updateMediaState(meetingId, {
          userId: user?.id || '',
          isVideoEnabled: isVideoEnabled,
          isMuted: !newState,
          isScreenSharing: isScreenSharing
        });
      } catch (error) {
        toast.error('Failed to toggle audio');
      }
    }
  };

  const startScreenShare = async () => {
    if (!meetingId) return;

    try {
      await socketService.startScreenShare(meetingId);
      setIsScreenSharing(true);
      toast.success('Screen sharing started');
    } catch (error) {
      toast.error('Failed to start screen sharing');
    }
  };

  const stopScreenShare = async () => {
    if (!meetingId) return;

    try {
      await socketService.stopScreenShare(meetingId);
      setIsScreenSharing(false);
      toast.success('Screen sharing stopped');
    } catch (error) {
      toast.error('Failed to stop screen sharing');
    }
  };

  if (!meeting) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">{meeting.title}</h1>
          <p className="text-sm text-gray-300">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={leaveMeeting}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Phone className="h-4 w-4" />
          <span>Leave</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className="flex-1 p-4">
          {!isJoined ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Ready to join?</h2>
                <p className="text-gray-300 mb-6">{meeting.description}</p>
                <button
                  onClick={joinMeeting}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto"
                >
                  <Video className="h-5 w-5" />
                  <span>Join Meeting</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-gray-800 rounded-lg relative">
              {/* Local video */}
              <div className="absolute top-4 right-4 w-32 h-24 bg-gray-700 rounded-lg overflow-hidden z-10">
                <div className="w-full h-full flex items-center justify-center text-white text-xs">
                  <VideoOff className="h-6 w-6" />
                </div>
                <div className="absolute bottom-1 left-1 text-white text-xs bg-black/50 px-1 rounded">
                  You
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/80 rounded-lg px-4 py-2">
                <button
                  onClick={toggleAudio}
                  className={isAudioEnabled ? 'control-btn' : 'control-btn-active'}
                >
                  {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={isVideoEnabled ? 'control-btn' : 'control-btn-active'}
                >
                  {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  className={isScreenSharing ? 'control-btn-active' : 'control-btn'}
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Participants */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Participants ({participants.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {participants.map((participant) => (
              <div key={participant.id} className="p-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {participant.user.firstName[0]}{participant.user.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {participant.user.firstName} {participant.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {participant.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingPage;