import { connect, Socket } from "socket.io-client";

export let socket: Socket;
export let isReady = false;

export const initializeSocket = () => {
  socket = connect("http://localhost:4002", {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });
  return socket;
};
