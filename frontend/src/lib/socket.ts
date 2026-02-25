// Note: Requires socket.io-client - install with: npm install socket.io-client

import { io, Socket } from 'socket.io-client';

let socket: Socket;

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '';
    socket = io(socketUrl, {
      transports: ['websocket'],
    });
  }
  return socket;
}
