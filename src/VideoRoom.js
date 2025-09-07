import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
} from '@livekit/components-react';
import '@livekit/components-styles';

const VideoRoom = ({ user, roomName, onLeave }) => {
  const [token, setToken] = useState('');

  useEffect(() => {
    if (!user?.name || !roomName) return;

    const getToken = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/livekit-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_name: roomName, identity: user.name }),
        });
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.error('Failed to get LiveKit token:', error);
      }
    };

    getToken();
  }, [user?.name, roomName]);

  if (!token) {
    return <div>Getting token...</div>;
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.REACT_APP_LIVEKIT_URL}
      onDisconnected={onLeave}
      // Use the default LiveKit theme for nice styles.
      data-lk-theme="default"
      style={{ height: '100%' }}
    >
      <VideoConference
        chatMessageFormatter={formatChatMessageLinks}
        SettingsComponent={undefined}
      />
    </LiveKitRoom>
  );
};

export default VideoRoom;
