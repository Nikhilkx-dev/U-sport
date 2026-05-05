import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

let socketInstance = null;

export const useSocket = (events = {}) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Keep latest handlers in a ref so we never need to re-register
  // when callbacks change (avoids the infinite loop from new object refs)
  const handlersRef = useRef(events);
  useEffect(() => {
    handlersRef.current = events;
  });

  useEffect(() => {
    if (!user) return;

    if (!socketInstance) {
      socketInstance = io('/', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
    }

    socketRef.current = socketInstance;
    socketInstance.emit('join_room', user.role);

    // Create stable wrappers that always call the latest handler via ref
    const stableHandlers = {};
    Object.keys(handlersRef.current).forEach((event) => {
      stableHandlers[event] = (...args) => {
        handlersRef.current[event]?.(...args);
      };
      socketInstance.on(event, stableHandlers[event]);
    });

    return () => {
      Object.entries(stableHandlers).forEach(([event, handler]) => {
        socketInstance?.off(event, handler);
      });
    };
  // Only re-run when the user changes, NOT when event callbacks change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return socketRef.current;
};
