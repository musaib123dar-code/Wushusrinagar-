import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList
} from 'react-native';

const DashboardScreen = ({ navigation }: any) => {
  const [meetings] = useState([
    { id: '1', title: 'Team Standup', status: 'scheduled' },
    { id: '2', title: 'Client Meeting', status: 'live' }
  ]);

  const handleJoinMeeting = (meetingId: string) => {
    navigation.navigate('MeetingRoom', { meetingId });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => handleJoinMeeting('new')}
      >
        <Text style={styles.createButtonText}>Create New Meeting</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Your Meetings</Text>

      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.meetingCard}>
            <Text style={styles.meetingTitle}>{item.title}</Text>
            <View style={styles.meetingFooter}>
              <Text style={[
                styles.status,
                item.status === 'live' ? styles.statusLive : styles.statusScheduled
              ]}>
                {item.status}
              </Text>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinMeeting(item.id)}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  createButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
  meetingCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  meetingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  status: {
    padding: 5,
    borderRadius: 4,
    fontSize: 12,
    color: '#fff'
  },
  statusLive: {
    backgroundColor: '#4CAF50'
  },
  statusScheduled: {
    backgroundColor: '#FFC107'
  },
  joinButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 4
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

export default DashboardScreen;
