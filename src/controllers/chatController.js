const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const ChatBlock = require('../models/ChatBlock');
const User = require('../models/User');
const Member = require('../models/Member');
const Staff = require('../models/Staff');
const Gym = require('../models/Gym');
const {
  emitNewMessage,
  emitReactionUpdate,
  emitMessageDeleted,
  isUserOnline,
} = require('../utils/chatSocket');

// Helper to resolve user gym ID safely
function getUserGymId(user) {
  if (!user) return null;
  if (user.gym?._id) return user.gym._id.toString();
  if (user.gym) return user.gym.toString();
  return null;
}

// Ensure official Gym Community Group exists for this gym
async function ensureGymCommunityGroup(gymId, currentUserId) {
  if (!gymId) return null;

  let community = await ChatConversation.findOne({
    gym: gymId,
    isCommunity: true,
  });

  const gymDoc = await Gym.findById(gymId);
  const gymName = gymDoc?.name || 'Gym Club';

  if (!community) {
    // Get all users currently in this gym
    const gymUsers = await User.find({ gym: gymId, isActive: true }).select('_id');
    const participantIds = gymUsers.map((u) => u._id);

    community = await ChatConversation.create({
      gym: gymId,
      type: 'group',
      name: `${gymName} Community`,
      description: `Official gym lounge for all members, trainers, and staff of ${gymName}.`,
      isCommunity: true,
      participants: participantIds,
      admins: [currentUserId],
      lastActivity: new Date(),
      lastMessage: {
        text: `Welcome everyone to the official ${gymName} chat! 💪 Connect, ask for spotters, and share your fitness PRs.`,
        senderName: 'GymPulse System',
        createdAt: new Date(),
        messageType: 'announcement',
      },
    });

    // Create introductory message
    await ChatMessage.create({
      gym: gymId,
      conversation: community._id,
      sender: currentUserId,
      senderName: 'GymPulse System',
      senderRole: 'admin',
      text: `Welcome everyone to the official ${gymName} chat! 💪 Connect, ask for spotters, and share your fitness PRs.`,
      messageType: 'announcement',
    });
  } else {
    // Make sure current user is included in participants if not already
    const isParticipant = community.participants.some(
      (p) => p.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      community.participants.push(currentUserId);
      await community.save();
    }
  }

  return community;
}

// @desc    Get all conversations for current user in their gym
// @route   GET /api/chat/conversations
exports.getConversations = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    if (!gymId) {
      return res.status(400).json({ success: false, message: 'Gym context is required' });
    }

    const currentUserId = req.user._id;

    // Ensure official gym community group exists
    await ensureGymCommunityGroup(gymId, currentUserId);

    // Find all conversations where current user is participant or it's gym community
    const conversations = await ChatConversation.find({
      gym: gymId,
      $or: [{ participants: currentUserId }, { isCommunity: true }],
    })
      .populate('participants', 'name email phone role avatar')
      .populate('admins', 'name role')
      .sort({ lastActivity: -1 });

    // Fetch users blocked by current user and users who blocked current user
    const [blockedByMeList, hasBlockedMeList] = await Promise.all([
      ChatBlock.find({ gym: gymId, blocker: currentUserId }).select('blocked'),
      ChatBlock.find({ gym: gymId, blocked: currentUserId }).select('blocker'),
    ]);

    const blockedByMeSet = new Set(blockedByMeList.map((b) => b.blocked.toString()));
    const hasBlockedMeSet = new Set(hasBlockedMeList.map((b) => b.blocker.toString()));

    const formatted = conversations.map((conv) => {
      const convObj = conv.toObject();

      // Check if pinned or muted by user
      convObj.isPinned = (conv.pinnedBy || []).some(
        (id) => id.toString() === currentUserId.toString()
      );
      convObj.isMuted = (conv.mutedBy || []).some(
        (id) => id.toString() === currentUserId.toString()
      );

      // Unread count for current user
      const unreadMap = conv.unreadCounts || new Map();
      convObj.unreadCount =
        typeof unreadMap.get === 'function'
          ? unreadMap.get(currentUserId.toString()) || 0
          : unreadMap[currentUserId.toString()] || 0;

      // Annotate direct chat participant
      if (convObj.type === 'direct') {
        const otherUser = (convObj.participants || []).find(
          (p) => p && p._id && p._id.toString() !== currentUserId.toString()
        ) || convObj.participants?.[0];

        if (otherUser) {
          const otherId = otherUser._id ? otherUser._id.toString() : '';
          convObj.otherParticipant = {
            _id: otherUser._id,
            name: otherUser.name || 'Gym Member',
            email: otherUser.email || '',
            phone: otherUser.phone || '',
            role: otherUser.role || 'member',
            avatar: otherUser.avatar || '',
            isOnline: isUserOnline(otherId),
            isBlockedByMe: blockedByMeSet.has(otherId),
            hasBlockedMe: hasBlockedMeSet.has(otherId),
          };
          convObj.name = otherUser.name || 'Gym Member';
          convObj.avatar = otherUser.avatar || '';
          convObj.roleBadge = otherUser.role || 'member';
        }
      } else {
        // Group chat
        convObj.onlineCount = (convObj.participants || []).filter((p) =>
          p && p._id && isUserOnline(p._id.toString())
        ).length;
      }

      return convObj;
    });

    // Pinned conversations at the very top, then sorted by lastActivity
    formatted.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    });

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('getConversations Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get or create 1-on-1 direct conversation with gym member/trainer
// @route   POST /api/chat/conversations/direct
exports.getOrCreateDirectConversation = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required' });
    }

    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot start conversation with yourself' });
    }

    // Verify target user belongs to SAME gym
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUserGymId = getUserGymId(targetUser);
    if (targetUserGymId !== gymId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot chat with users from another gym club.',
      });
    }

    // Find existing direct conversation
    let conversation = await ChatConversation.findOne({
      gym: gymId,
      type: 'direct',
      participants: { $all: [req.user._id, targetUserId] },
    }).populate('participants', 'name email phone role avatar');

    if (!conversation) {
      conversation = await ChatConversation.create({
        gym: gymId,
        type: 'direct',
        participants: [req.user._id, targetUserId],
        lastActivity: new Date(),
        lastMessage: {
          text: 'Conversation started',
          senderName: req.user.name,
          createdAt: new Date(),
          messageType: 'system',
        },
      });

      conversation = await ChatConversation.findById(conversation._id).populate(
        'participants',
        'name email phone role avatar'
      );
    }

    const convObj = conversation.toObject();

    const otherUser = (convObj.participants || []).find(
      (p) => p && p._id && p._id.toString() !== req.user._id.toString()
    ) || targetUser;

    const otherId = otherUser._id ? otherUser._id.toString() : targetUserId.toString();
    const [isBlockedByMe, hasBlockedMe] = await Promise.all([
      ChatBlock.exists({ gym: gymId, blocker: req.user._id, blocked: otherId }),
      ChatBlock.exists({ gym: gymId, blocker: otherId, blocked: req.user._id }),
    ]);

    convObj.isPinned = (conversation.pinnedBy || []).some(
      (id) => id.toString() === req.user._id.toString()
    );
    convObj.isMuted = (conversation.mutedBy || []).some(
      (id) => id.toString() === req.user._id.toString()
    );
    convObj.unreadCount = 0;

    convObj.otherParticipant = {
      _id: otherUser._id || targetUser._id,
      name: otherUser.name || targetUser.name || 'Gym Member',
      email: otherUser.email || targetUser.email || '',
      phone: otherUser.phone || targetUser.phone || '',
      role: otherUser.role || targetUser.role || 'member',
      avatar: otherUser.avatar || targetUser.avatar || '',
      isOnline: isUserOnline(otherId),
      isBlockedByMe: !!isBlockedByMe,
      hasBlockedMe: !!hasBlockedMe,
    };
    convObj.name = otherUser.name || targetUser.name || 'Gym Member';
    convObj.avatar = otherUser.avatar || targetUser.avatar || '';
    convObj.roleBadge = otherUser.role || targetUser.role || 'member';

    res.json({ success: true, data: convObj });
  } catch (error) {
    console.error('getOrCreateDirectConversation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a custom Gym Group conversation
// @route   POST /api/chat/conversations/group
exports.createGroupConversation = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const { name, description, participantIds = [], avatar = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    // Ensure creator is in participants
    const finalParticipants = Array.from(
      new Set([req.user._id.toString(), ...participantIds.map((id) => id.toString())])
    );

    // Verify all participants belong to this gym
    const validUsers = await User.find({
      _id: { $in: finalParticipants },
      gym: gymId,
    }).select('_id name');

    const validUserIds = validUsers.map((u) => u._id);

    const group = await ChatConversation.create({
      gym: gymId,
      type: 'group',
      name: name.trim(),
      description: (description || '').trim(),
      avatar: avatar || '',
      participants: validUserIds,
      admins: [req.user._id],
      lastActivity: new Date(),
      lastMessage: {
        text: `${req.user.name} created the group "${name.trim()}".`,
        senderName: req.user.name,
        createdAt: new Date(),
        messageType: 'system',
      },
    });

    // Create introductory system message
    await ChatMessage.create({
      gym: gymId,
      conversation: group._id,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      text: `${req.user.name} created the group "${name.trim()}". Welcome everyone!`,
      messageType: 'system',
    });

    const populatedGroup = await ChatConversation.findById(group._id)
      .populate('participants', 'name email phone role avatar')
      .populate('admins', 'name role');

    res.status(201).json({ success: true, data: populatedGroup });
  } catch (error) {
    console.error('createGroupConversation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add or remove members from a group
// @route   PUT /api/chat/conversations/:id/participants
exports.updateGroupParticipants = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const { action, memberId } = req.body; // action: 'add' | 'remove'

    if (!action || !memberId) {
      return res.status(400).json({ success: false, message: 'Action and memberId required' });
    }

    const conversation = await ChatConversation.findOne({
      _id: req.params.id,
      gym: gymId,
      type: 'group',
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Group conversation not found' });
    }

    const isAdminOrCreator =
      conversation.admins.some((a) => a.toString() === req.user._id.toString()) ||
      req.user.role === 'admin' ||
      req.user.role === 'superadmin';

    if (!isAdminOrCreator && action === 'remove' && memberId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only group admins can remove members' });
    }

    const targetUser = await User.findById(memberId).select('name');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    if (action === 'add') {
      if (!conversation.participants.some((p) => p.toString() === memberId.toString())) {
        conversation.participants.push(memberId);
      }
    } else if (action === 'remove') {
      conversation.participants = conversation.participants.filter(
        (p) => p.toString() !== memberId.toString()
      );
    }

    conversation.lastActivity = new Date();
    await conversation.save();

    // Create system audit message
    const sysMsgText =
      action === 'add'
        ? `${targetUser.name} was added to the group by ${req.user.name}.`
        : `${targetUser.name} left the group.`;

    const sysMsg = await ChatMessage.create({
      gym: gymId,
      conversation: conversation._id,
      sender: req.user._id,
      senderName: 'System',
      senderRole: 'admin',
      text: sysMsgText,
      messageType: 'system',
    });

    emitNewMessage(gymId, conversation._id, sysMsg, conversation.participants);

    const updated = await ChatConversation.findById(conversation._id)
      .populate('participants', 'name email phone role avatar')
      .populate('admins', 'name role');

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateGroupParticipants Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const conversation = await ChatConversation.findOne({
      _id: req.params.id,
      gym: gymId,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Check if participant or community
    const isMember =
      conversation.isCommunity ||
      conversation.participants.some((p) => p.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied to this conversation' });
    }

    // Check if user cleared history earlier
    const userClear = (conversation.clearedBy || []).find(
      (c) => c.user.toString() === req.user._id.toString()
    );

    const messageQuery = {
      conversation: conversation._id,
      deletedFor: { $ne: req.user._id },
    };

    if (userClear?.clearedAt) {
      messageQuery.createdAt = { $gt: userClear.clearedAt };
    }

    const messages = await ChatMessage.find(messageQuery)
      .populate('sender', 'name role avatar')
      .populate('replyTo.messageId', 'text senderName mediaUrl')
      .sort({ createdAt: 1 })
      .limit(100);

    // Reset unread counter for current user in this conversation
    if (conversation.unreadCounts) {
      if (typeof conversation.unreadCounts.set === 'function') {
        conversation.unreadCounts.set(req.user._id.toString(), 0);
      } else {
        conversation.unreadCounts[req.user._id.toString()] = 0;
      }
      await conversation.save();
    }

    // Mark messages as read by current user
    ChatMessage.updateMany(
      {
        conversation: conversation._id,
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      }
    ).exec();

    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error('getMessages Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a message in conversation
// @route   POST /api/chat/conversations/:id/messages
exports.sendMessage = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const { text = '', mediaUrl = '', messageType = 'text', replyTo = null } = req.body;

    if (!text.trim() && !mediaUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const conversation = await ChatConversation.findOne({
      _id: req.params.id,
      gym: gymId,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Direct chat block enforcement:
    if (conversation.type === 'direct') {
      const otherUserId = conversation.participants.find(
        (p) => p.toString() !== req.user._id.toString()
      );

      if (otherUserId) {
        // Check if either user has blocked the other
        const blockExists = await ChatBlock.findOne({
          gym: gymId,
          $or: [
            { blocker: req.user._id, blocked: otherUserId },
            { blocker: otherUserId, blocked: req.user._id },
          ],
        });

        if (blockExists) {
          const isBlockedByMe = blockExists.blocker.toString() === req.user._id.toString();
          return res.status(403).json({
            success: false,
            message: isBlockedByMe
              ? 'You have blocked this member. Unblock them first to send messages.'
              : 'You cannot send messages to this member as they have blocked you.',
            isBlocked: true,
          });
        }
      }
    }

    // Create the message
    const message = await ChatMessage.create({
      gym: gymId,
      conversation: conversation._id,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      senderAvatar: req.user.avatar || '',
      text: text.trim(),
      mediaUrl: mediaUrl.trim(),
      messageType,
      replyTo: replyTo?.messageId ? replyTo : undefined,
      readBy: [req.user._id],
    });

    // Update conversation last message & activity
    conversation.lastMessage = {
      text: messageType === 'image' ? '📷 Photo' : messageType === 'workout_pr' ? `💪 PR: ${text}` : text.trim(),
      sender: req.user._id,
      senderName: req.user.name,
      createdAt: message.createdAt,
      mediaUrl: mediaUrl.trim(),
      messageType,
    };
    conversation.lastActivity = new Date();

    // Increment unread count for other participants
    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }
    const recipients = conversation.participants.filter(
      (p) => p.toString() !== req.user._id.toString()
    );

    recipients.forEach((p) => {
      const pid = p.toString();
      const currentCount =
        typeof conversation.unreadCounts.get === 'function'
          ? conversation.unreadCounts.get(pid) || 0
          : conversation.unreadCounts[pid] || 0;

      if (typeof conversation.unreadCounts.set === 'function') {
        conversation.unreadCounts.set(pid, currentCount + 1);
      } else {
        conversation.unreadCounts[pid] = currentCount + 1;
      }
    });

    await conversation.save();

    // Populate sender info for real-time broadcast and instant UI rendering
    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender', 'name role avatar');

    // Broadcast in real-time via Socket.IO
    emitNewMessage(gymId, conversation._id, populatedMessage, recipients);

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    console.error('sendMessage Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle emoji reaction on a message
// @route   POST /api/chat/messages/:id/react
exports.reactToMessage = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required' });
    }

    const message = await ChatMessage.findOne({
      _id: req.params.id,
      gym: gymId,
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const userId = req.user._id;
    let existingReaction = message.reactions.find((r) => r.emoji === emoji);

    if (existingReaction) {
      const userIndex = existingReaction.users.findIndex(
        (u) => u.toString() === userId.toString()
      );
      if (userIndex > -1) {
        // Remove reaction (toggle off)
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        // Add user to reaction
        existingReaction.users.push(userId);
      }
    } else {
      // New emoji reaction
      message.reactions.push({
        emoji,
        users: [userId],
      });
    }

    await message.save();

    emitReactionUpdate(message.conversation, message._id, message.reactions);

    res.json({ success: true, data: message.reactions });
  } catch (error) {
    console.error('reactToMessage Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete message (for self or everyone)
// @route   DELETE /api/chat/messages/:id
exports.deleteMessage = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const forEveryone =
      req.body?.forEveryone === true ||
      req.body?.forEveryone === 'true' ||
      req.query?.forEveryone === 'true';

    const message = await ChatMessage.findOne({
      _id: req.params.id,
      gym: gymId,
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const isSender = message.sender.toString() === req.user._id.toString();
    const isGymAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    if (forEveryone) {
      if (!isSender && !isGymAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only the sender or gym admin can delete message for everyone',
        });
      }
      message.isDeletedForEveryone = true;
      message.text = 'This message was deleted';
      message.mediaUrl = '';
      message.reactions = [];
      await message.save();

      // Update conversation lastMessage if this was the last message
      const conversation = await ChatConversation.findById(message.conversation);
      if (conversation && conversation.lastMessage) {
        const lastMsgTime = new Date(conversation.lastMessage.createdAt || 0).getTime();
        const thisMsgTime = new Date(message.createdAt).getTime();
        if (Math.abs(lastMsgTime - thisMsgTime) < 2000) {
          conversation.lastMessage.text = 'This message was deleted';
          conversation.lastMessage.mediaUrl = '';
          await conversation.save();
        }
      }

      emitMessageDeleted(message.conversation, message._id, true, req.user._id);
    } else {
      // Delete for self only
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
      emitMessageDeleted(message.conversation, message._id, false, req.user._id);
    }

    res.json({ success: true, message: 'Message deleted successfully', messageId: message._id, forEveryone });
  } catch (error) {
    console.error('deleteMessage Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle pin conversation
// @route   POST /api/chat/conversations/:id/pin
exports.togglePinConversation = async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const userId = req.user._id;
    const isPinned = (conversation.pinnedBy || []).some((id) => id.toString() === userId.toString());

    if (isPinned) {
      conversation.pinnedBy = (conversation.pinnedBy || []).filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      if (!conversation.pinnedBy) conversation.pinnedBy = [];
      conversation.pinnedBy.push(userId);
    }

    await conversation.save();
    res.json({ success: true, isPinned: !isPinned });
  } catch (error) {
    console.error('togglePinConversation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear conversation history for current user
// @route   POST /api/chat/conversations/:id/clear
exports.clearConversation = async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.clearedBy) conversation.clearedBy = [];
    const existingIndex = conversation.clearedBy.findIndex(
      (c) => c.user.toString() === req.user._id.toString()
    );

    if (existingIndex > -1) {
      conversation.clearedBy[existingIndex].clearedAt = new Date();
    } else {
      conversation.clearedBy.push({
        user: req.user._id,
        clearedAt: new Date(),
      });
    }

    await conversation.save();
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('clearConversation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a conversation completely
// @route   DELETE /api/chat/conversations/:id
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.isCommunity) {
      return res.status(400).json({ success: false, message: 'Official community lounge cannot be deleted' });
    }

    const isDirect = conversation.type === 'direct';
    const isParticipant = (conversation.participants || []).some(
      (p) => p.toString() === req.user._id.toString()
    );
    const isGroupAdmin =
      (conversation.admins || []).some((a) => a.toString() === req.user._id.toString()) ||
      ['admin', 'superadmin'].includes(req.user.role);

    if (isDirect) {
      if (!isParticipant && !['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    } else {
      if (!isGroupAdmin) {
        return res.status(403).json({ success: false, message: 'Only group admins can delete this group' });
      }
    }

    // Delete all messages belonging to this conversation
    await ChatMessage.deleteMany({ conversation: conversation._id });

    // Delete the conversation
    await ChatConversation.deleteOne({ _id: conversation._id });

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('deleteConversation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk delete conversations
// @route   POST /api/chat/conversations/bulk-delete
exports.bulkDeleteConversations = async (req, res) => {
  try {
    const { conversationIds } = req.body;
    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No conversation IDs provided' });
    }

    const userId = req.user._id;
    const isGymAdmin = ['admin', 'superadmin'].includes(req.user.role);

    // Find eligible conversations (exclude community chat to protect it)
    const conversations = await ChatConversation.find({
      _id: { $in: conversationIds },
      isCommunity: { $ne: true },
    });

    const eligibleIds = [];
    for (const conv of conversations) {
      const isParticipant = (conv.participants || []).some(
        (p) => p.toString() === userId.toString()
      );
      const isGroupAdmin =
        (conv.admins || []).some((a) => a.toString() === userId.toString()) || isGymAdmin;

      if (conv.type === 'direct') {
        if (isParticipant || isGymAdmin) eligibleIds.push(conv._id);
      } else {
        if (isGroupAdmin) eligibleIds.push(conv._id);
      }
    }

    if (eligibleIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No eligible conversations to delete' });
    }

    // Delete messages of all eligible conversations
    await ChatMessage.deleteMany({ conversation: { $in: eligibleIds } });

    // Delete the conversations
    await ChatConversation.deleteMany({ _id: { $in: eligibleIds } });

    res.json({
      success: true,
      message: `${eligibleIds.length} conversations deleted successfully`,
      deletedCount: eligibleIds.length,
      deletedIds: eligibleIds,
    });
  } catch (error) {
    console.error('bulkDeleteConversations Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all eligible chat members from current user's gym
// @route   GET /api/chat/gym-members
exports.getGymMembersForChat = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    if (!gymId) {
      return res.status(400).json({ success: false, message: 'Gym context is required' });
    }

    const currentUserId = req.user._id;

    // 1. Sync any existing registered Member records to shadow User accounts if missing
    const unlinkedMembers = await Member.find({
      gym: gymId,
      status: { $ne: 'deleted' },
    });

    for (const mem of unlinkedMembers) {
      const emailToCheck = mem.email
        ? mem.email.toLowerCase().trim()
        : `member_${mem.memberId.toLowerCase()}@gym.internal`;

      let userDoc = await User.findOne({
        $or: [{ memberRef: mem._id }, { email: emailToCheck }],
      });

      if (!userDoc) {
        await User.create({
          name: mem.fullName,
          email: emailToCheck,
          password: `Member@${mem.phone ? mem.phone.slice(-4) : '2026'}`,
          role: 'member',
          gym: gymId,
          phone: mem.phone || '',
          memberRef: mem._id,
          avatar: mem.photoUrl || '',
          isEmailVerified: true,
        }).catch(() => {});
      }
    }

    // 2. Fetch all gym users except current user
    const users = await User.find({
      gym: gymId,
      _id: { $ne: currentUserId },
      isActive: true,
    })
      .select('name email phone role avatar createdAt')
      .sort({ role: 1, name: 1 });

    // 3. Fetch blocked users by current user
    const blockedList = await ChatBlock.find({
      gym: gymId,
      blocker: currentUserId,
    }).select('blocked');
    const blockedSet = new Set(blockedList.map((b) => b.blocked.toString()));

    const membersWithMeta = users.map((u) => {
      const uid = u._id.toString();
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatar: u.avatar,
        isOnline: isUserOnline(uid),
        isBlocked: blockedSet.has(uid),
      };
    });

    res.json({ success: true, count: membersWithMeta.length, data: membersWithMeta });
  } catch (error) {
    console.error('getGymMembersForChat Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Block a user in the gym
// @route   POST /api/chat/block
exports.blockUser = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const { targetUserId, reason = '' } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required' });
    }

    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.role === 'admin' || targetUser.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'Gym management administrators cannot be blocked.' });
    }

    await ChatBlock.findOneAndUpdate(
      { gym: gymId, blocker: req.user._id, blocked: targetUserId },
      { gym: gymId, blocker: req.user._id, blocked: targetUserId, reason },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: `Successfully blocked ${targetUser.name}` });
  } catch (error) {
    console.error('blockUser Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unblock a user in the gym
// @route   POST /api/chat/unblock
exports.unblockUser = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required' });
    }

    await ChatBlock.findOneAndDelete({
      gym: gymId,
      blocker: req.user._id,
      blocked: targetUserId,
    });

    res.json({ success: true, message: 'User successfully unblocked' });
  } catch (error) {
    console.error('unblockUser Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get list of blocked users by current user
// @route   GET /api/chat/blocked-users
exports.getBlockedUsers = async (req, res) => {
  try {
    const gymId = getUserGymId(req.user);
    const blockedEntries = await ChatBlock.find({
      gym: gymId,
      blocker: req.user._id,
    }).populate('blocked', 'name email phone role avatar');

    res.json({ success: true, count: blockedEntries.length, data: blockedEntries });
  } catch (error) {
    console.error('getBlockedUsers Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
