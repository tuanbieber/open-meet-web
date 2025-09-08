import React, { useState, useEffect } from 'react';
import {
  useSearchParams,
} from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import VideoRoom from './VideoRoom';
import './App.css';
import logo from './assets/logo.png';
import meeting from './assets/meeting.png';

const apiUrl = process.env.REACT_APP_API_URL;

function App() {
  const [user, setUser] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showRoomCreated, setShowRoomCreated] = useState(false);
  const [newlyCreatedRoom, setNewlyCreatedRoom] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const roomCode = searchParams.get('code');
    if (roomCode) {
      setRoomName(roomCode);
    } else {
      // If the user navigates back and the code is gone, clear the room
      const currentCode = new URLSearchParams(window.location.search).get('code');
      if (!currentCode) {
        setRoomName('');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      const { user, expiry } = JSON.parse(userSession);

      if (new Date().getTime() > expiry) {
        localStorage.removeItem('userSession');
        setUser(null);
      } else {
        setUser(user);
      }
    }
  }, []);

  const responseGoogle = (codeResponse) => {
    fetch(`${apiUrl}/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(codeResponse),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Server response:', data);
        const session = {
          user: data,
          expiry: new Date().getTime() + 5 * 60 * 1000,
        };
        localStorage.setItem('userSession', JSON.stringify(session));
        setUser(data);
      })
      .catch((error) => {
        console.error('Error sending token to server:', error);
      });
  };

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('userSession');
    setUser(null);
    setRoomName('');
    setShowRoomCreated(false);
  };

  const createNewRoom = async () => {
    if (!user || !user.token) {
      console.error('Cannot create room: User is not logged in or token is missing.');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
      });
      const data = await response.json();
      if (data.room && data.room.name) {
        setNewlyCreatedRoom(data.room.name);
        setShowRoomCreated(true);
      } else {
        console.error('Failed to create room: No room name in response');
      }
    } catch (error) {
      console.error('Error creating new room:', error);
    }
  };

  const joinRoom = () => {
    setRoomName(newlyCreatedRoom);
    setShowRoomCreated(false);
    setSearchParams({ code: newlyCreatedRoom });
  };

  const copyRoomName = () => {
    const roomUrl = `${window.location.origin}?code=${newlyCreatedRoom}`;
    navigator.clipboard.writeText(roomUrl);
  };

  const leaveRoom = () => {
    setRoomName('');
    setSearchParams({});
  };

  const joinEnteredRoom = async () => {
    const roomCode = joinInput.trim();
    if (!roomCode) {
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (user && user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(`${apiUrl}/rooms/${roomCode}`, {
        headers: headers,
      });

      if (response.ok) {
        // Room exists, proceed to join
        setJoinError(''); // Clear any previous error
        setRoomName(roomCode);
        setSearchParams({ code: roomCode });
      } else if (response.status === 404) {
        // Room does not exist
        setJoinError('Room not found. Please check the code and try again.');
      } else {
        // Other server error
        setJoinError('An error occurred while trying to join the room.');
      }
    } catch (error) {
      console.error('Error validating room:', error);
      setJoinError('Could not connect to the server. Please try again later.');
    }
  };

  const handleJoinInputKeyDown = (event) => {
    if (event.key === 'Enter' && joinInput.trim()) {
      event.preventDefault(); // Prevent form submission or other default "Enter" behavior
      joinEnteredRoom();
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="App">
        <header className="App-header"> 
          <div className="top-bar">
            <a href="https://www.linkedin.com/company/dev-more" target="_blank" rel="noopener noreferrer" className="logo-link">
              <div className="logo">
                <img src={logo} alt="Open Meet" />
                <span>Open Meet</span>
              </div>
            </a>
            {user && (
              <div className="user-info">
                <img src={user.picture} alt={user.email} className="user-avatar" />
                <button onClick={handleLogout} className="logout-button">Logout</button>
              </div>
            )}
          </div>
        </header>
        <main className="main-content">
          {user ? (
            roomName ? (
              <VideoRoom user={user} roomName={roomName} onLeave={leaveRoom} />
            ) : showRoomCreated ? (
              <div className="room-created-popup">
                <h3>Room Created!</h3>
                <p>Share this room name with others:</p>
                <div className="room-name-box">
                  <strong>{newlyCreatedRoom}</strong>
                </div>
                <button onClick={copyRoomName} className="action-button">Copy</button>
                <button onClick={joinRoom} className="action-button primary">Join Room</button>
                <button onClick={() => setShowRoomCreated(false)} className="action-button">Close</button>
              </div>
            ) : (
              <div className="home-container">
                <div className="home-left">
                  <h1>Video calls and meetings for everyone</h1>
                  <p>Connect, collaborate, and celebrate from anywhere with Open Meet</p>
                  <div className="home-actions">
                    <button onClick={createNewRoom} className="action-button primary new-meeting">
                      <svg focusable="false" width="24" height="24" viewBox="0 0 24 24" className="Hdh4hc cIGbvc NMm5M"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
                      New meeting
                    </button>
                    <div className="join-action">
                      <input 
                        type="text" 
                        placeholder="Enter a code or link" 
                        value={joinInput}
                        onChange={(e) => {
                          setJoinInput(e.target.value);
                          if (joinError) {
                            setJoinError('');
                          }
                        }} 
                        onKeyDown={handleJoinInputKeyDown}
                        className="join-input"
                      />
                      <button
                        onClick={joinEnteredRoom}
                        className="join-button"
                        disabled={!joinInput.trim()}
                      >
                        Join
                      </button>
                    </div>
                  </div>
                  {joinError && (
                    <div className="error-message-container">
                      <svg aria-hidden="true" className="error-icon" fill="currentColor" focusable="false" width="16px" height="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
                      <span className="error-text">{joinError}</span>
                    </div>
                  )}
                  <div className="learn-more">
                    <a href="https://www.linkedin.com/company/dev-more" target="_blank" rel="noopener noreferrer">Learn more</a> about Open Meet
                  </div>
                </div>
                <div className="home-right">
                  <a href="https://www.linkedin.com/company/dev-more" target="_blank" rel="noopener noreferrer">
                    <img src={meeting} alt="Get a link" />
                  </a>
                </div>
              </div>
            )
          ) : (
            <div className="home-container">
                <div className="home-left">
                  <h1>Video calls and meetings for everyone</h1>
                  <p>Connect, collaborate, and celebrate from anywhere with Open Meet</p>
                  <div className="home-actions">
                    <GoogleLogin
                        onSuccess={responseGoogle}
                        onError={() => {
                            console.log('Login Failed');
                        }}
                        flow="auth-code"
                    />
                </div>
                  <div className="learn-more">
                    <a href="https://www.linkedin.com/company/dev-more" target="_blank" rel="noopener noreferrer">Learn more</a> about Open Meet
                  </div>
                </div>
                <div className="home-right">
                  <a href="https://www.linkedin.com/company/dev-more" target="_blank" rel="noopener noreferrer">
                    <img src={meeting} alt="Get a link" />
                  </a>
                </div>
              </div>
          )}
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
