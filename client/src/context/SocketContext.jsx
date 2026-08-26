import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const getSocketTarget = () => {
      const envUrl = import.meta.env.VITE_API_URL;
      if (envUrl) {
        // Disable socket.io if backend is hosted on Vercel (serverless doesn't support websockets)
        if (envUrl.includes('vercel.app')) return null;
        return envUrl.replace(/\/api\/?$/, '');
      }
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:5001';
      }
      return 'https://auraestate.onrender.com';
    };

    const targetUrl = getSocketTarget();
    if (!targetUrl) return; // Don't initialize socket on Vercel

    const newSocket = io(targetUrl, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    if (user) {
      newSocket.emit('join_chat', { userId: user._id });
    }

    return () => newSocket.close();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
