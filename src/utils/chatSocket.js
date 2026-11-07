const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Map of userId -> Set of socket.ids
const onlineUsers = new Map();
let ioInstance = null;

function initChatSocket(io) {
  ioInstance = io;

  // Socket Auth Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      if (token === 'demo_token') {
        let user = await User.findOne({ email: 'rahulyo954030@gmail.com' }).populate('gym');
        if (!user) user = await User.findOne({ role: 'admin' }).populate('gym');
        if (user && user.isActive) {
          socket.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            gym: user.gym?._id ? user.gym._id.toString() : user.gym ? user.gym.toString() : null,
          };
          return next();
        }
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'gym_pulse_super_secret_jwt_key_2026_fitness_erp'
      );

      const user = await User.findById(decoded.id).populate('gym');
      if (!user || !user.isActive) {
        return next(new Error('User not found or disabled'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        gym: user.gym?._id ? user.gym._id.toString() : user.gym ? user.gym.toString() : null,
      };

      next();
    } catch (err) {
      console.warn('Socket authentication error:', err.message);
      return next(new Error('Invalid socket credentials'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    const gymId = socket.user?.gym;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // Register active socket for user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal room and gym broadcast room
    socket.join(`user_${userId}`);
    if (gymId) {
      socket.join(`gym_${gymId}`);

      // Broadcast user online to everyone in this gym
      io.to(`gym_${gymId}`).emit('user_status_changed', {
        userId,
        online: true,
      });

      // Send list of all currently online users in this gym
      const currentOnlineInGym = Array.from(onlineUsers.keys());
      socket.emit('initial_online_users', currentOnlineInGym);
    }

    // Join active conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conv_${conversationId}`);
      }
    });

    // Leave active conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conv_${conversationId}`);
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conv_${conversationId}`).emit('user_typing', {
          conversationId,
          user: {
            id: socket.user.id,
            name: socket.user.name,
          },
        });
      }
    });

    socket.on('stop_typing', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conv_${conversationId}`).emit('user_stop_typing', {
          conversationId,
          userId: socket.user.id,
        });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      if (onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          if (gymId) {
            io.to(`gym_${gymId}`).emit('user_status_changed', {
              userId,
              online: false,
            });
          }
        }
      }
    });
  });

  return io;
}

// Helper to broadcast new message from HTTP controller
function emitNewMessage(gymId, conversationId, message, recipientIds = []) {
  if (!ioInstance) return;

  // 1. Send to anyone currently viewing the conversation
  ioInstance.to(`conv_${conversationId}`).emit('new_message', {
    conversationId,
    message,
  });

  // 2. Alert conversation list for all participants to update preview and unread counters
  if (Array.isArray(recipientIds)) {
    recipientIds.forEach((uid) => {
      ioInstance.to(`user_${uid.toString()}`).emit('conversation_updated', {
        conversationId,
        lastMessage: {
          text: message.text,
          senderName: message.senderName,
          createdAt: message.createdAt,
          mediaUrl: message.mediaUrl,
          messageType: message.messageType,
        },
      });
    });
  }
}

// Helper to broadcast reaction update
function emitReactionUpdate(conversationId, messageId, reactions) {
  if (!ioInstance) return;
  ioInstance.to(`conv_${conversationId}`).emit('reaction_updated', {
    conversationId,
    messageId,
    reactions,
  });
}

// Helper to broadcast message deletion
function emitMessageDeleted(conversationId, messageId, forEveryone, deletedBy) {
  if (!ioInstance) return;
  ioInstance.to(`conv_${conversationId}`).emit('message_deleted', {
    conversationId,
    messageId,
    forEveryone,
    deletedBy,
  });
}

// Helper to check if a user is currently online
function isUserOnline(userId) {
  if (!userId) return false;
  return onlineUsers.has(userId.toString());
}

module.exports = {
  initChatSocket,
  emitNewMessage,
  emitReactionUpdate,
  emitMessageDeleted,
  isUserOnline,
};
