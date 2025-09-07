import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';

const VideoRoom = ({ user, onLeave }) => {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const localVideoRef = useRef(null);
  const remoteVideosContainerRef = useRef(null);

  useEffect(() => {
    const connectToRoom = async () => {
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      setRoom(newRoom);

      newRoom
        .on(RoomEvent.ParticipantConnected, (participant) => {
          setParticipants((prev) => [...prev, participant]);
        })
        .on(RoomEvent.ParticipantDisconnected, (participant) => {
          setParticipants((prev) => prev.filter((p) => p.sid !== participant.sid));
          const videoElement = document.getElementById(participant.sid);
          if (videoElement) {
            videoElement.remove();
          }
        })
        .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === 'video' || track.kind === 'audio') {
            const element = document.createElement(track.kind);
            element.id = participant.sid;
            element.autoplay = true;
            track.attach(element);
            remoteVideosContainerRef.current.appendChild(element);
          }
        })
        .on(RoomEvent.LocalTrackPublished, (publication) => {
          if (publication.track.kind === 'video') {
            const localTrack = publication.track;
            if (localVideoRef.current) {
              localTrack.attach(localVideoRef.current);
            }
          }
        });

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/get-livekit-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room_name: 'my-first-room', identity: user.name }),
        });
        const data = await response.json();
        const token = data.token;

        const livekitUrl = process.env.REACT_APP_LIVEKIT_URL;

        await newRoom.connect(livekitUrl, token);
        await newRoom.localParticipant.enableCameraAndMicrophone();
        setParticipants([newRoom.localParticipant, ...newRoom.remoteParticipants.values()]);
      } catch (error) {
        console.error('Failed to connect to LiveKit room:', error);
      }
    };

    connectToRoom();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, []);

  return (
    <div>
      <h2>Video Room</h2>
      <button onClick={() => {
        if (room) {
          room.disconnect();
        }
        onLeave();
      }}>Leave Room</button>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ margin: '10px' }}>
          <h4>My Video ({room?.localParticipant.identity})</h4>
          <video ref={localVideoRef} autoPlay muted style={{ width: '320px' }} />
        </div>
        <div ref={remoteVideosContainerRef} style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* Remote videos will be appended here */}
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
