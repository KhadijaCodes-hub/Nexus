import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';

// Establish socket connection to the local backend dynamically
const socket = io('http://localhost:5000');

export const VideoCallPage = () => {
  const { userId: roomId } = useParams(); // Using the dynamic route param as roomId
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // 1. Get Local Media Configuration
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
      setStream(mediaStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      // 2. Establish Peer Connection Handlers
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerConnectionRef.current = peerConnection;

      mediaStream.getTracks().forEach((track) => peerConnection.addTrack(track, mediaStream));

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { target: roomId, candidate: event.candidate });
        }
      };

      // 3. Socket Event Listeners for WebRTC Signaling
      socket.emit('join-room', roomId, user?.id);

      socket.on('user-connected', async (newUserId) => {
        // Create an offer when a new user joins
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { target: roomId, caller: user?.id, sdp: offer });
      });

      socket.on('offer', async (payload) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { target: payload.caller, sdp: answer });
      });

      socket.on('answer', async (payload) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      });

      socket.on('ice-candidate', (candidate) => {
        try {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      });
    });

    return () => {
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [roomId, user?.id]);

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    navigate('/meetings'); // Route back to meetings instead
  };

  return (
    <div className="h-[80vh] flex flex-col bg-gray-900 rounded-xl overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur">
        Nexus Chamber: {roomId}
      </div>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Remote Video (Main) */}
        <div className="flex-1 bg-black rounded-xl overflow-hidden relative border border-gray-700 shadow-2xl">
          <video
            className="w-full h-full object-cover"
            ref={remoteVideoRef}
            autoPlay
            playsInline
          />
          <div className="absolute bottom-4 left-4 text-white bg-black/60 px-3 py-1 rounded text-sm">
            Remote Peer
          </div>
        </div>

        {/* Local Video (PiP) */}
        <div className="w-64 bg-gray-800 rounded-xl overflow-hidden relative border-2 border-primary-500 flex-shrink-0 shadow-xl">
          <video
            className="w-full h-full object-cover"
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
          />
          <div className="absolute bottom-2 left-2 text-white bg-black/60 px-2 py-1 rounded text-xs">
            You
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-20 bg-gray-800 flex items-center justify-center gap-4 px-6 border-t border-gray-700">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'} text-white`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'} text-white`}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition ml-4"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};
