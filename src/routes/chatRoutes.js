const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversations,
  getOrCreateDirectConversation,
  createGroupConversation,
  updateGroupParticipants,
  getMessages,
  sendMessage,
  reactToMessage,
  deleteMessage,
  togglePinConversation,
  clearConversation,
  deleteConversation,
  bulkDeleteConversations,
  getGymMembersForChat,
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require('../controllers/chatController');

// All chat routes are protected
router.use(protect);

// Conversations
router.get('/conversations', getConversations);
router.post('/conversations/direct', getOrCreateDirectConversation);
router.post('/conversations/group', createGroupConversation);
router.put('/conversations/:id/participants', updateGroupParticipants);
router.post('/conversations/:id/pin', togglePinConversation);
router.post('/conversations/:id/clear', clearConversation);
router.post('/conversations/bulk-delete', bulkDeleteConversations);
router.delete('/conversations/:id', deleteConversation);

// Messages
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);
router.post('/messages/:id/react', reactToMessage);
router.delete('/messages/:id', deleteMessage);

// Members & Moderation (Gym-scoped)
router.get('/gym-members', getGymMembersForChat);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.get('/blocked-users', getBlockedUsers);

module.exports = router;
