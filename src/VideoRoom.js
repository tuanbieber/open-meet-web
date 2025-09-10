import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
  useParticipants,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useRoomContext,
  useDataChannel,
  TrackToggle,
  DisconnectButton,
} from '@livekit/components-react';
import { Track, DataPacket_Kind } from 'livekit-client';
import '@livekit/components-styles';
import './VideoRoom.css';

// Helper function to get participant info including avatar
const getParticipantInfo = (participants, participantIdentity) => {
  const participant = participants.find(p => p.identity === participantIdentity);
  
  if (participant && participant.metadata) {
    try {
      const metadata = JSON.parse(participant.metadata);
      return {
        name: metadata.name || participantIdentity,
        avatar: metadata.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participantIdentity)}&background=f59e0b&color=fff&size=32`
      };
    } catch (e) {
      return {
        name: participantIdentity,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(participantIdentity)}&background=f59e0b&color=fff&size=32`
      };
    }
  }
  return {
    name: participantIdentity,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(participantIdentity)}&background=f59e0b&color=fff&size=32`
  };
};

// Custom Chat Component
const CustomChat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);
  const room = useRoomContext();
  const participants = useParticipants();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    // Use a small delay to ensure DOM is fully updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // Listen for data messages
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload, participant) => {
      try {
        const message = JSON.parse(new TextDecoder().decode(payload));
        if (message.type === 'chat') {
          const participantInfo = getParticipantInfo(participants, participant?.identity || 'Unknown');
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: message.text,
            sender: participantInfo.name,
            senderIdentity: participant?.identity || 'Unknown',
            avatar: participantInfo.avatar,
            timestamp: new Date(),
            isLocal: participant?.isLocal || false
          }]);
        }
      } catch (e) {
        console.error('Error parsing chat message:', e);
      }
    };

    room.on('dataReceived', handleDataReceived);
    return () => room.off('dataReceived', handleDataReceived);
  }, [room]);

  const sendMessage = () => {
    if (!newMessage.trim() || !room) return;

    const message = {
      type: 'chat',
      text: newMessage.trim(),
    };

    // Send to other participants
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(message)),
      DataPacket_Kind.RELIABLE
    );

    // Add to local messages
    const localParticipantInfo = getParticipantInfo(participants, room.localParticipant.identity);
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: newMessage.trim(),
      sender: localParticipantInfo.name,
      senderIdentity: room.localParticipant.identity,
      avatar: user?.picture || localParticipantInfo.avatar, // Use actual user avatar if available
      timestamp: new Date(),
      isLocal: true
    }]);

    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="custom-chat">
      <div className="chat-header">
        <span className="chat-icon">💬</span>
        <span className="chat-title">Messages</span>
      </div>
      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <span>💬</span>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.isLocal ? 'local' : 'remote'}`}>
                <div className="message-avatar">
                  <img 
                    src={message.avatar}
                    alt={message.sender}
                    className="message-avatar-img"
                  />
                </div>
                <div className="message-body">
                  <div className="message-header">
                    <span className="message-sender">{message.sender}</span>
                    <span className="message-time">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="message-content">{message.text}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button 
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="chat-send-button"
        >
          <span>📤</span>
        </button>
      </div>
    </div>
  );
};

// Custom component for participant list
const ParticipantList = ({ user }) => {
  const participants = useParticipants();
  const room = useRoomContext();

  return (
    <div className="participant-list-container">
      <h3 className="participant-list-title">
        Participants ({participants.length})
      </h3>
      <div className="participant-list">
        {participants.map((participant) => {
          const isLocalParticipant = participant.identity === room?.localParticipant?.identity;
          const participantInfo = getParticipantInfo(participants, participant.identity);
          
          // Use user's Google avatar for local participant
          const avatar = isLocalParticipant && user?.picture ? user.picture : participantInfo.avatar;
          const name = isLocalParticipant && user?.name ? user.name : participantInfo.name;
          
          return (
            <div key={participant.sid} className="participant-item">
              <div className="participant-avatar">
                <img 
                  src={avatar}
                  alt={name}
                  className="participant-avatar-img"
                />
              </div>
              <div className="participant-info">
                <div className="participant-name">
                  {name}
                </div>
                <div className="participant-status">
                  <span className={`status-indicator ${participant.isCameraEnabled ? 'camera-on' : 'camera-off'}`}>
                    📹
                  </span>
                  <span className={`status-indicator ${participant.isMicrophoneEnabled ? 'mic-on' : 'mic-off'}`}>
                    🎤
                  </span>
                  {participant.isLocal && <span className="you-label">(You)</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Custom meeting layout component
const CustomMeetingLayout = ({ user }) => {
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const participants = useParticipants();
  const room = useRoomContext();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const containerWidth = window.innerWidth;
    const newWidth = containerWidth - e.clientX;
    
    // Set minimum and maximum widths
    const minWidth = 250;
    const maxWidth = containerWidth * 0.6; // Max 60% of screen width
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div className="custom-meeting-layout">
      <div className="video-area">
        <GridLayout tracks={tracks}>
          <ParticipantTile />
        </GridLayout>
        <div className="lk-control-bar">
          <TrackToggle source={Track.Source.Microphone} showIcon={true} />
          <TrackToggle source={Track.Source.Camera} showIcon={true} />
          <TrackToggle source={Track.Source.ScreenShare} showIcon={true} />
          <button 
            onClick={toggleChat}
            className={`lk-button lk-button-menu chat-toggle-btn ${isChatVisible ? 'lk-button-active' : ''}`}
            title={isChatVisible ? 'Hide Chat' : 'Show Chat'}
          >
            💬
          </button>
          <button 
            onClick={() => {
              if (room) {
                room.disconnect();
              }
            }}
            className="lk-button lk-button-menu lk-disconnect-button"
            title="Leave Meeting"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10 3l4 4-4 4v-3H6V6h4V3z"/>
              <path d="M3 2h6v2H3v8h6v2H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
            </svg>
          </button>
        </div>
      </div>
      {isChatVisible && (
        <>
          <div 
            className="resize-handle"
            onMouseDown={handleMouseDown}
          />
          <div 
            className="sidebar-right"
            style={{ width: sidebarWidth }}
          >
            <ParticipantList user={user} />
            <CustomChat user={user} />
          </div>
        </>
      )}
      <RoomAudioRenderer />
    </div>
  );
};

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
      data-lk-theme="default"
      style={{ height: '100%' }}
    >
      <CustomMeetingLayout user={user} />
    </LiveKitRoom>
  );
};

export default VideoRoom;
