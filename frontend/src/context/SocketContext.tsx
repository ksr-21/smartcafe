import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Connect to local proxy (same domain)
    const newSocket = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('⚡ Socket connected to server');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('⚡ Socket disconnected');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Handle auto-joining rooms based on auth state
  useEffect(() => {
    if (!socket || !connected) return;

    if (user) {
      if (user.role === 'cafe_admin') {
        socket.emit('join:cafe', user.cafe?.id);
        console.log(`Joined cafe room: ${user.cafe?.id}`);
      } else if (user.role === 'kitchen_staff') {
        socket.emit('join:kitchen', user.cafe?.id);
        socket.emit('join:cafe', user.cafe?.id); // Admin features inside kitchen too
        console.log(`Joined kitchen/cafe room: ${user.cafe?.id}`);
      }
    }
  }, [socket, connected, user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
