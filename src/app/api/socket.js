import { Server } from 'socket.io';

const users = new Map();

const initSocket = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId;
      users.set(userId, socket.id);

      socket.on('message', async (message) => {
        const recipientSocket = users.get(message.receiverId);
        if (recipientSocket) {
          io.to(recipientSocket).emit('message', message);
        }
      });

      socket.on('typing', ({ senderId, receiverId }) => {
        const recipientSocket = users.get(receiverId);
        if (recipientSocket) {
          io.to(recipientSocket).emit('typing', { senderId });
        }
      });

      socket.on('disconnect', () => {
        users.delete(userId);
      });
    });
  }
  res.end();
};

export default initSocket;
