import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import './VideoRoom.css';

const VideoRoom = ({ user, roomName, onLeave }) => {
  const [token, setToken] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showErrorPopup = (message) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const handleErrorClose = () => {
    setShowError(false);
    onLeave();
  };

  useEffect(() => {
    if (!roomName) return;

    const getToken = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/livekit-tokens`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify({ room_name: roomName }),
        });

        if (response.status === 404) {
          showErrorPopup('Room not found. The room may have been deleted or the code is incorrect.');
          return;
        }

        if (!response.ok) {
          showErrorPopup('Failed to join the room. Please try again.');
          return;
        }

        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.error('Failed to get LiveKit token:', error);
        showErrorPopup('Could not connect to the server. Please check your internet connection and try again.');
      }
    };

    getToken();
  }, [roomName, user]);

  if (!token) {
    return (
      <div>
        <div>Please wait, we're getting your video room ready...</div>
        {showError && (
          <div className="error-popup-overlay">
            <div className="error-popup">
              <div className="error-popup-content">
                <h3>Oops! Something went wrong</h3>
                <p>{errorMessage}</p>
                <button onClick={handleErrorClose} className="error-popup-button">
                  Go back to home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
