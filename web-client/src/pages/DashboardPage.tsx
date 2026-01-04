import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authStore } from '../store/authStore';
import { apiService } from '../services/apiService';
import { Calendar, Video, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Meeting } from '../types/shared';

const DashboardPage: React.FC = () => {
  const user = authStore((state) => state.user);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [myMeetings, setMyMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      
      // Load upcoming meetings
      const upcomingResponse = await apiService.getUpcomingMeetings(5);
      if (upcomingResponse.success) {
        setUpcomingMeetings(upcomingResponse.data || []);
      }

      // Load user's meetings
      const myMeetingsResponse = await apiService.getUserMeetings(1, 5);
      if (myMeetingsResponse.success) {
        setMyMeetings(myMeetingsResponse.data || []);
      }
    } catch (error) {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Manage your meetings, join video calls, and connect with your team.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/meetings/create"
          className="bg-primary-600 text-white rounded-lg p-6 hover:bg-primary-700 transition-colors"
        >
          <Video className="h-8 w-8 mb-2" />
          <h3 className="text-lg font-semibold">Create Meeting</h3>
          <p className="text-primary-100">Schedule a new video conference</p>
        </Link>

        <Link
          to="/meetings"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <Calendar className="h-8 w-8 text-primary-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">Browse Meetings</h3>
          <p className="text-gray-600">Find and join existing meetings</p>
        </Link>

        <Link
          to="/profile"
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <Users className="h-8 w-8 text-primary-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
          <p className="text-gray-600">Manage your account and preferences</p>
        </Link>
      </div>

      {/* Upcoming Meetings */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h2>
        </div>
        <div className="p-6">
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                    <p className="text-sm text-gray-600">
                      {meeting.host.firstName} {meeting.host.lastName}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(meeting.startTime)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {meeting.maxParticipants} participants
                    </span>
                    <Link
                      to={`/meeting/${meeting.id}`}
                      className="btn-primary btn-sm"
                    >
                      Join
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No upcoming meetings scheduled
            </p>
          )}
        </div>
      </div>

      {/* My Meetings */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Meetings</h2>
        </div>
        <div className="p-6">
          {myMeetings.length > 0 ? (
            <div className="space-y-4">
              {myMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                    <p className="text-sm text-gray-600">{meeting.description}</p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(meeting.startTime)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      meeting.status === 'live' 
                        ? 'bg-green-100 text-green-800'
                        : meeting.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {meeting.status}
                    </span>
                    <Link
                      to={`/meeting/${meeting.id}`}
                      className="btn-secondary btn-sm"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              You haven't created any meetings yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;