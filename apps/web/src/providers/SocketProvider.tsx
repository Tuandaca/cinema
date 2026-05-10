'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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

  useEffect(() => {
    // Connect to the backend booking namespace directly to avoid Next.js proxy issues with WebSockets
    const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:3006';
    const socketInstance = io(`${backendUrl}/booking`, {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
