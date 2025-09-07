import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import './App.css';

const apiUrl = process.env.REACT_APP_API_URL;

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user info is stored in localStorage on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
        // Save user info to localStorage
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
      })
      .catch((error) => {
        console.error('Error sending token to server:', error);
      });
  };

  const handleLogout = () => {
    googleLogout();
    // Remove user info from localStorage
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="App">
        <header className="App-header">
          <h1>Open Meet</h1>
          {user ? (
            <div>
              <img src={user.picture} alt={user.name} style={{ borderRadius: '50%' }} />
              <h3>Welcome, {user.name}</h3>
              <p>{user.email}</p>
              <button onClick={handleLogout}>Logout</button>
            </div>
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
