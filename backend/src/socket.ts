import { Server } from 'socket.io';

let io: Server;

export const setIo = (socketIo: Server) => {
  io = socketIo;
};

export const getIo = () => io;