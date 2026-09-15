'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/providers/AuthProvider';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    // Connect to the backend booking namespace directly with JWT auth
    const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:3006';
    const socketInstance = io(`${backendUrl}/booking`, {
      transports: ['websocket'],
      auth: {
        token: token || '',
      },
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server (Authenticated)');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
