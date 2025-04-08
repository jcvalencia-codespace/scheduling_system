import { Server as SocketIOServer } from 'socket.io';

let io;

export const config = {
  api: {
    bodyParser: false,
  },
};

const userSocketMap = new Map();

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Initializing socket server...');
    
    io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId;
      console.log('Client connected:', { socketId: socket.id, userId });
      
      if (userId) {
        userSocketMap.set(userId, socket.id);
        
        socket.on('message', (message) => {
          console.log('Message received:', message);
          const recipientSocketId = userSocketMap.get(message.receiverId);
          
          if (recipientSocketId) {
            console.log('Sending message to recipient:', message.receiverId);
            io.to(recipientSocketId).emit('message', message);
          }
          
          // Echo back to sender for confirmation
          socket.emit('message', message);
        });

        socket.on('disconnect', () => {
          console.log('Client disconnected:', userId);
          userSocketMap.delete(userId);
        });
      }
    });

    res.socket.server.io = io;
  }

  res.end();
}
