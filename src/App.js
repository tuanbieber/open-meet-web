import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import VideoRoom from './VideoRoom';
import './App.css';
import logo from './assets/logo.png';

const apiUrl = process.env.REACT_APP_API_URL;

function App() {
  const [user, setUser] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [showRoomCreated, setShowRoomCreated] = useState(false);
  const [newlyCreatedRoom, setNewlyCreatedRoom] = useState('');

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
        console.error('Failed t o create room: No room name in response');
      }
    } catch (error) {
      console.error('Error creating new room:', error);
    }
  };

  const joinRoom = () => {
    setRoomName(newlyCreatedRoom);
    setShowRoomCreated(false);
  };

  const copyRoomName = () => {
    navigator.clipboard.writeText(newlyCreatedRoom);
    // Optional: Add user feedback, e.g., an alert or a temporary message
    alert('Room name copied to clipboard!');
  };

  const leaveRoom = () => {
    setRoomName('');
  };

  const joinEnteredRoom = () => {
    if (joinInput.trim()) {
      setRoomName(joinInput.trim());
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="App">
        <header className="App-header">
          <div className="top-bar">
            <div className="logo">
              <img src={logo} alt="Open Meet" />
              <span>Open Meet</span>
            </div>
            {user && (
              <div className="user-info">
                <img src={user.picture} alt={user.name} className="user-avatar" />
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
                        onChange={(e) => setJoinInput(e.target.value)} 
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
                  <div className="learn-more">
                    <a href="#">Learn more</a> about Open Meet
                  </div>
                </div>
                <div className="home-right">
                  <img src="https://www.gstatic.com/meet/user_edu_get_a_link_light_90698cd7b4ca04d3005c962a3756c42d.svg" alt="Get a link" />
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
                    <a href="#">Learn more</a> about Open Meet
                  </div>
                </div>
                <div className="home-right">
                  <img src="https://www.gstatic.com/meet/user_edu_get_a_link_light_90698cd7b4ca04d3005c962a3756c42d.svg" alt="Get a link" />
                </div>
              </div>
          )}
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
