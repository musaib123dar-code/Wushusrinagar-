import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';

const { width, height } = Dimensions.get('window');

const MeetingRoomScreen = ({ navigation, route }: any) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState(null);

  useEffect(() => {
    initializeMedia();

    return () => {
      if (localStream) {
      }
    };
  }, []);

  const initializeMedia = async () => {
    try {
      console.log('Initializing media...');
    } catch (error) {
      console.error('Failed to initialize media:', error);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const leaveMeeting = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <View style={styles.localVideo}>
          <Text style={styles.videoLabel}>You</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, !isAudioEnabled && styles.controlButtonDisabled]}
          onPress={toggleAudio}
        >
          <Text style={styles.controlButtonText}>
            {isAudioEnabled ? '🎤' : '🎤'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !isVideoEnabled && styles.controlButtonDisabled]}
          onPress={toggleVideo}
        >
          <Text style={styles.controlButtonText}>
            {isVideoEnabled ? '📹' : '📹'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.leaveButton]}
          onPress={leaveMeeting}
        >
          <Text style={styles.controlButtonText}>📞</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  localVideo: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: '#000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  videoLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 15
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center'
  },
  controlButtonDisabled: {
    backgroundColor: '#f44336'
  },
  leaveButton: {
    backgroundColor: '#f44336'
  },
  controlButtonText: {
    fontSize: 24
  }
});

export default MeetingRoomScreen;
