import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Meeting } from '../../../shared/types';

const DashboardPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const response = await meetingAPI.listMyMeetings();
      setMeetings(response.data.meetings);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await meetingAPI.create({ title, description });
      const meeting = response.data.meeting;
      navigate(`/meeting/${meeting.id}`);
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = (meetingId: string) => {
    navigate(`/meeting/${meetingId}`);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{
        backgroundColor: '#2196F3',
        color: 'white',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1>VideoConf Dashboard</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span>Welcome, {user?.username}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#2196F3',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Create New Meeting
          </button>
        </div>

        <h2 style={{ marginBottom: '20px' }}>Your Meetings</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h3>{meeting.title}</h3>
              {meeting.description && <p style={{ color: '#666', marginTop: '10px' }}>{meeting.description}</p>}
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: meeting.status === 'live' ? '#4CAF50' : '#FFC107',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {meeting.status}
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>Code: {meeting.meetingCode}</span>
              </div>
              <button
                onClick={() => handleJoinMeeting(meeting.id)}
                style={{
                  marginTop: '15px',
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Join Meeting
              </button>
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '500px'
            }}>
              <h2 style={{ marginBottom: '20px' }}>Create New Meeting</h2>
              <form onSubmit={handleCreateMeeting}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Meeting Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create & Join'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
