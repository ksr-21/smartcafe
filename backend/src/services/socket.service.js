let io;

const initSocket = (socketIo) => {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a cafe room (for admins/kitchen)
    socket.on('join:cafe', (cafeId) => {
      socket.join(`cafe:${cafeId}`);
      console.log(`Socket ${socket.id} joined cafe room: ${cafeId}`);
    });

    // Join a table room (for customers tracking their order)
    socket.on('join:table', ({ cafeId, tableId }) => {
      socket.join(`table:${cafeId}:${tableId}`);
      console.log(`Socket ${socket.id} joined table room: ${cafeId}:${tableId}`);
    });

    // Join an order room (for tracking specific order)
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    // Kitchen staff joins kitchen room
    socket.on('join:kitchen', (cafeId) => {
      socket.join(`kitchen:${cafeId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

// Emit new order to cafe admin and kitchen
const emitNewOrder = (cafeId, order) => {
  if (!io) return;
  io.to(`cafe:${cafeId}`).emit('order:new', order);
  io.to(`kitchen:${cafeId}`).emit('order:new', order);
};

// Emit order status update to admin, kitchen, and customer
const emitOrderUpdate = (cafeId, tableId, order) => {
  if (!io) return;
  io.to(`cafe:${cafeId}`).emit('order:updated', order);
  io.to(`kitchen:${cafeId}`).emit('order:updated', order);
  io.to(`table:${cafeId}:${tableId}`).emit('order:updated', order);
  io.to(`order:${order._id}`).emit('order:updated', order);
};

// Emit order cancelled
const emitOrderCancelled = (cafeId, tableId, order) => {
  if (!io) return;
  io.to(`cafe:${cafeId}`).emit('order:cancelled', order);
  io.to(`kitchen:${cafeId}`).emit('order:cancelled', order);
  io.to(`table:${cafeId}:${tableId}`).emit('order:cancelled', order);
};

// Emit table status change
const emitTableUpdate = (cafeId, table) => {
  if (!io) return;
  io.to(`cafe:${cafeId}`).emit('table:updated', table);
};

const getIo = () => io;

module.exports = {
  initSocket,
  emitNewOrder,
  emitOrderUpdate,
  emitOrderCancelled,
  emitTableUpdate,
  getIo,
};
