import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import VideoRoom from './VideoRoom';
import './App.css';

const apiUrl = process.env.REACT_APP_API_URL;

function App() {
  const [user, setUser] = useState(null);
  const [inRoom, setInRoom] = useState(false);

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
    setInRoom(false);
  };

  const joinRoom = () => {
    setInRoom(true);
  };

  const leaveRoom = () => {
    setInRoom(false);
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="App">
        <header className="App-header">
          <h1>Open Meet</h1>
          {user ? (
            inRoom ? (
              <VideoRoom user={user} onLeave={leaveRoom} />
            ) : (
              <div>
                <img src={user.picture} alt={user.name} style={{ borderRadius: '50%' }} />
                <h3>Welcome, {user.name}</h3>
                <p>{user.email}</p>
                <button onClick={joinRoom}>Join Video Room</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )
          ) : (
            <GoogleLogin
              onSuccess={responseGoogle}
              onError={() => {
                console.log('Login Failed');
              }}
              flow="auth-code"
            />
          )}
        </header>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
