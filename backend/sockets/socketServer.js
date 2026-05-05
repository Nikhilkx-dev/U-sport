const socketServer = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join role-specific room
    socket.on('join_room', (role) => {
      socket.join(role);
      console.log(`👤 Socket ${socket.id} joined room: ${role}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketServer;
