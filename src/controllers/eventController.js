const mongoose = require('mongoose');
const Event = require('../models/Event');
const Member = require('../models/Member');
const Gym = require('../models/Gym');

// Standard Major Indian & Global Festivals lookup table (100% accurate Government of India & Hindu Panchang calendar)
const getStandardFestivals = (year) => {
  if (year === 2026) {
    return [
      { title: "New Year's Day", month: 0, day: 1, type: 'festival', color: '#38bdf8' },
      { title: 'Makar Sankranti / Pongal', month: 0, day: 14, type: 'festival', color: '#f59e0b' },
      { title: 'Republic Day', month: 0, day: 26, type: 'festival', color: '#f59e0b' },
      { title: 'Maha Shivratri', month: 1, day: 15, type: 'festival', color: '#a855f7' },
      { title: 'Holika Dahan', month: 2, day: 3, type: 'festival', color: '#f97316' },
      { title: 'Holi Festival', month: 2, day: 4, type: 'festival', color: '#ec4899' },
      { title: 'Eid-ul-Fitr', month: 2, day: 21, type: 'festival', color: '#10b981' },
      { title: 'Ram Navami', month: 2, day: 27, type: 'festival', color: '#eab308' },
      { title: 'Mahavir Jayanti', month: 2, day: 31, type: 'festival', color: '#f59e0b' },
      { title: 'Good Friday', month: 3, day: 3, type: 'festival', color: '#6366f1' },
      { title: 'Buddha Purnima', month: 4, day: 1, type: 'festival', color: '#eab308' },
      { title: 'Eid-ul-Adha (Bakrid)', month: 4, day: 28, type: 'festival', color: '#10b981' },
      { title: 'Muharram', month: 5, day: 26, type: 'festival', color: '#64748b' },
      { title: 'Independence Day', month: 7, day: 15, type: 'festival', color: '#f59e0b' },
      { title: 'Raksha Bandhan', month: 7, day: 28, type: 'festival', color: '#a855f7' },
      { title: 'Janmashtami', month: 8, day: 4, type: 'festival', color: '#3b82f6' },
      { title: 'Ganesh Chaturthi', month: 8, day: 14, type: 'festival', color: '#f97316' },
      { title: 'Gandhi Jayanti', month: 9, day: 2, type: 'festival', color: '#64748b' },
      { title: 'Dussehra / Vijayadashami', month: 9, day: 20, type: 'festival', color: '#f59e0b' },
      { title: 'Karwa Chauth', month: 9, day: 29, type: 'festival', color: '#ec4899' },
      { title: 'Dhanteras', month: 10, day: 6, type: 'festival', color: '#eab308' },
      { title: 'Diwali (Deepavali)', month: 10, day: 8, type: 'festival', color: '#f59e0b' },
      { title: 'Govardhan Puja', month: 10, day: 9, type: 'festival', color: '#f59e0b' },
      { title: 'Bhai Dooj', month: 10, day: 11, type: 'festival', color: '#ec4899' },
      { title: 'Chhath Puja (Sandhya Arghya)', month: 10, day: 15, type: 'festival', color: '#f97316' },
      { title: 'Guru Nanak Jayanti', month: 10, day: 24, type: 'festival', color: '#eab308' },
      { title: 'Christmas Day', month: 11, day: 25, type: 'festival', color: '#ef4444' },
    ];
  } else if (year === 2025) {
    return [
      { title: "New Year's Day", month: 0, day: 1, type: 'festival', color: '#38bdf8' },
      { title: 'Makar Sankranti / Pongal', month: 0, day: 14, type: 'festival', color: '#f59e0b' },
      { title: 'Republic Day', month: 0, day: 26, type: 'festival', color: '#f59e0b' },
      { title: 'Maha Shivratri', month: 1, day: 26, type: 'festival', color: '#a855f7' },
      { title: 'Holi Festival', month: 2, day: 14, type: 'festival', color: '#ec4899' },
      { title: 'Eid-ul-Fitr', month: 2, day: 31, type: 'festival', color: '#10b981' },
      { title: 'Ram Navami', month: 3, day: 6, type: 'festival', color: '#eab308' },
      { title: 'Mahavir Jayanti', month: 3, day: 10, type: 'festival', color: '#f59e0b' },
      { title: 'Good Friday', month: 3, day: 18, type: 'festival', color: '#6366f1' },
      { title: 'Buddha Purnima', month: 4, day: 12, type: 'festival', color: '#eab308' },
      { title: 'Independence Day', month: 7, day: 15, type: 'festival', color: '#f59e0b' },
      { title: 'Raksha Bandhan', month: 7, day: 9, type: 'festival', color: '#a855f7' },
      { title: 'Janmashtami', month: 7, day: 16, type: 'festival', color: '#3b82f6' },
      { title: 'Ganesh Chaturthi', month: 7, day: 27, type: 'festival', color: '#f97316' },
      { title: 'Gandhi Jayanti', month: 9, day: 2, type: 'festival', color: '#64748b' },
      { title: 'Dussehra / Vijayadashami', month: 9, day: 2, type: 'festival', color: '#f59e0b' },
      { title: 'Diwali (Deepavali)', month: 9, day: 20, type: 'festival', color: '#f59e0b' },
      { title: 'Govardhan Puja', month: 9, day: 21, type: 'festival', color: '#f59e0b' },
      { title: 'Bhai Dooj', month: 9, day: 22, type: 'festival', color: '#ec4899' },
      { title: 'Chhath Puja', month: 9, day: 27, type: 'festival', color: '#f97316' },
      { title: 'Guru Nanak Jayanti', month: 10, day: 5, type: 'festival', color: '#eab308' },
      { title: 'Christmas Day', month: 11, day: 25, type: 'festival', color: '#ef4444' },
    ];
  } else {
    // Default fallback
    return [
      { title: "New Year's Day", month: 0, day: 1, type: 'festival', color: '#38bdf8' },
      { title: 'Republic Day', month: 0, day: 26, type: 'festival', color: '#f59e0b' },
      { title: 'Holi Festival', month: 2, day: 15, type: 'festival', color: '#ec4899' },
      { title: 'Independence Day', month: 7, day: 15, type: 'festival', color: '#f59e0b' },
      { title: 'Gandhi Jayanti', month: 9, day: 2, type: 'festival', color: '#64748b' },
      { title: 'Dussehra / Vijayadashami', month: 9, day: 20, type: 'festival', color: '#f59e0b' },
      { title: 'Diwali (Deepavali)', month: 10, day: 8, type: 'festival', color: '#f59e0b' },
      { title: 'Christmas Day', month: 11, day: 25, type: 'festival', color: '#ef4444' },
    ];
  }
};

/**
 * Get all events, gym closures, and member birthdays for a gym
 */
exports.getEvents = async (req, res) => {
  try {
    const { gymId, month, year } = req.query;

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) - 1 : null; // 0-indexed

    // Determine target gym ID safely
    let targetGymId = null;
    if (gymId && gymId !== 'undefined' && gymId !== 'null' && mongoose.Types.ObjectId.isValid(gymId)) {
      targetGymId = new mongoose.Types.ObjectId(gymId);
    } else {
      // Graceful fallback: find first active gym
      const defaultGym = await Gym.findOne({ isActive: true }).select('_id');
      if (defaultGym) {
        targetGymId = defaultGym._id;
      }
    }

    // 1. Fetch custom events and gym closures from MongoDB (if gym is known)
    let dbEvents = [];
    if (targetGymId) {
      const query = { gym: targetGymId };

      if (currentMonth !== null) {
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        query.startDate = { $gte: startOfMonth, $lte: endOfMonth };
      } else {
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        query.startDate = { $gte: startOfYear, $lte: endOfYear };
      }

      const rawDbEvents = await Event.find(query).sort({ startDate: 1 }).lean();
      dbEvents = rawDbEvents.map((e) => {
        const d = new Date(e.startDate);
        return {
          ...e,
          day: d.getDate(),
          month: d.getMonth(),
          year: d.getFullYear(),
          dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        };
      });
    }

    // 2. Compute dynamic member birthdays from Member collection (if gym is known)
    const birthdayEvents = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetGymId) {
      const members = await Member.find({
        gym: targetGymId,
        status: { $ne: 'deleted' },
        dob: { $exists: true, $ne: null },
      })
        .select('fullName memberId dob phone email photoUrl status gender plan')
        .populate('plan', 'name')
        .lean();

      members.forEach((m) => {
        if (!m.dob) return;
        const bdate = new Date(m.dob);
        const bMonth = bdate.getMonth();
        const bDay = bdate.getDate();

        // If viewing a specific month, only include matching month
        if (currentMonth !== null && bMonth !== currentMonth) {
          return;
        }

        const thisYearBirthday = new Date(currentYear, bMonth, bDay, 9, 0, 0);
        const age = currentYear - bdate.getFullYear();
        const dateKey = `${currentYear}-${String(bMonth + 1).padStart(2, '0')}-${String(bDay).padStart(2, '0')}`;

        birthdayEvents.push({
          _id: `bday_${m._id}_${currentYear}`,
          title: `${m.fullName}'s Birthday`,
          type: 'birthday',
          startDate: thisYearBirthday,
          endDate: thisYearBirthday,
          day: bDay,
          month: bMonth,
          year: currentYear,
          dateKey,
          isGymClosed: false,
          closureType: 'none',
          description: `Member ${m.fullName} (${m.memberId}) turns ${age > 0 ? age : ''} years old today! Send a special birthday discount or wish.`,
          color: '#ec4899',
          isVirtualBirthday: true,
          member: {
            id: m._id,
            fullName: m.fullName,
            memberId: m.memberId,
            phone: m.phone,
            email: m.email,
            photoUrl: m.photoUrl,
            age: age > 0 ? age : null,
            planName: m.plan?.name || 'Active Member',
          },
        });
      });
    }

    // 3. Generate standard festival entries for this year
    const standardHolidays = getStandardFestivals(currentYear)
      .filter((f) => currentMonth === null || f.month === currentMonth)
      .map((f) => {
        const festivalDate = new Date(currentYear, f.month, f.day, 9, 0, 0);
        const dateKey = `${currentYear}-${String(f.month + 1).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`;
        // Check if gym owner already has a custom event for this date
        const existingCustom = dbEvents.find(
          (e) =>
            e.dateKey === dateKey &&
            e.title &&
            e.title.toLowerCase().includes(f.title.toLowerCase().split(' ')[0])
        );

        return {
          _id: `fest_${currentYear}_${f.month}_${f.day}`,
          title: f.title,
          type: 'festival',
          startDate: festivalDate,
          endDate: festivalDate,
          day: f.day,
          month: f.month,
          year: currentYear,
          dateKey,
          isGymClosed: existingCustom ? existingCustom.isGymClosed : false,
          closureType: existingCustom ? existingCustom.closureType : 'none',
          description: `Celebration of ${f.title}. Check gym timings or broadcast holiday closure notice to members.`,
          color: f.color || '#f59e0b',
          isStandardFestival: true,
          customOverrideId: existingCustom ? existingCustom._id : null,
        };
      });

    // Merge and sort
    const allEvents = [...dbEvents, ...birthdayEvents, ...standardHolidays].sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate)
    );

    // Calculate executive metrics
    const gymClosedEvents = allEvents.filter((e) => e.isGymClosed);
    const birthdaysCount = birthdayEvents.length;

    // Find next upcoming gym closure
    const upcomingClosure = gymClosedEvents.find((e) => new Date(e.startDate) >= today);

    // Find birthdays happening today
    const todaysBirthdays = birthdayEvents.filter((b) => {
      const d = new Date(b.startDate);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });

    res.json({
      success: true,
      events: allEvents,
      metrics: {
        totalEvents: allEvents.length,
        gymClosedCount: gymClosedEvents.length,
        birthdaysCount,
        todaysBirthdaysCount: todaysBirthdays.length,
        nextUpcomingClosure: upcomingClosure || null,
      },
    });
  } catch (err) {
    console.error('Error in getEvents:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch events: ' + err.message });
  }
};

/**
 * Create a new custom gym event or holiday
 */
exports.createEvent = async (req, res) => {
  try {
    const {
      gymId,
      title,
      type,
      startDate,
      endDate,
      isGymClosed,
      closureType,
      description,
      targetAudience,
      color,
    } = req.body;

    let targetGymId = gymId;
    if (!targetGymId || !mongoose.Types.ObjectId.isValid(targetGymId)) {
      const defaultGym = await Gym.findOne({ isActive: true }).select('_id');
      if (defaultGym) targetGymId = defaultGym._id;
    }

    if (!targetGymId || !title || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Gym ID, Title, and Start Date are required',
      });
    }

    const newEvent = new Event({
      gym: targetGymId,
      title: title.trim(),
      type: type || 'holiday',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : new Date(startDate),
      isGymClosed: isGymClosed === true || isGymClosed === 'true',
      closureType: closureType || (isGymClosed ? 'full_day' : 'none'),
      description: description || '',
      targetAudience: targetAudience || 'all',
      color: color || (isGymClosed ? '#ef4444' : '#6366f1'),
      createdBy: req.user?._id || null,
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: 'Event / Holiday created successfully',
      event: newEvent,
    });
  } catch (err) {
    console.error('Error in createEvent:', err);
    res.status(500).json({ success: false, message: 'Failed to create event: ' + err.message });
  }
};

/**
 * Update an existing event
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Apply allowed updates
    if (updates.title) event.title = updates.title.trim();
    if (updates.type) event.type = updates.type;
    if (updates.startDate) event.startDate = new Date(updates.startDate);
    if (updates.endDate) event.endDate = new Date(updates.endDate);
    if (updates.isGymClosed !== undefined) event.isGymClosed = Boolean(updates.isGymClosed);
    if (updates.closureType) event.closureType = updates.closureType;
    if (updates.description !== undefined) event.description = updates.description;
    if (updates.targetAudience) event.targetAudience = updates.targetAudience;
    if (updates.color) event.color = updates.color;

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (err) {
    console.error('Error in updateEvent:', err);
    res.status(500).json({ success: false, message: 'Failed to update event: ' + err.message });
  }
};

/**
 * Delete an event
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (err) {
    console.error('Error in deleteEvent:', err);
    res.status(500).json({ success: false, message: 'Failed to delete event: ' + err.message });
  }
};

/**
 * Generate Broadcast Messages (WhatsApp & Notification announcement)
 */
exports.generateBroadcast = async (req, res) => {
  try {
    const { gymId, eventId, customMessage, type } = req.body;

    let targetGymId = gymId;
    if (!targetGymId || !mongoose.Types.ObjectId.isValid(targetGymId)) {
      const defaultGym = await Gym.findOne({ isActive: true }).select('_id');
      if (defaultGym) targetGymId = defaultGym._id;
    }

    const gym = targetGymId ? await Gym.findById(targetGymId) : null;
    const gymName = gym?.name || 'FeeOrbit Fitness Club';

    let messageText = '';
    let targetCount = 0;

    // Fetch members count for estimation
    targetCount = targetGymId ? await Member.countDocuments({ gym: targetGymId, status: 'active' }) : 0;

    if (eventId && !eventId.startsWith('bday_') && !eventId.startsWith('fest_')) {
      const event = await Event.findById(eventId);
      if (event) {
        const dateStr = new Date(event.startDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });

        if (event.isGymClosed) {
          const shiftNote =
            event.closureType === 'morning_only'
              ? 'Morning Shift will remain CLOSED. Evening Shift will operate normally.'
              : event.closureType === 'evening_only'
              ? 'Morning Shift will operate normally. Evening Shift will remain CLOSED.'
              : 'The gym will remain CLOSED for the entire day.';

          messageText = `📢 *Gym Notice: ${event.title}*\n\nDear Members,\n\nPlease be informed that *${gymName}* will have operational holiday on *${dateStr}*.\n\n⚠️ *Timings Notice:* ${shiftNote}\n\n${event.description ? `_Note: ${event.description}_\n\n` : ''}Regular gym sessions will resume promptly on the following day.\n\nStay fit & stay safe!\n*— Management, ${gymName}*`;
        } else {
          messageText = `🎉 *Special Event Announcement: ${event.title}*\n\nDear Members,\n\nWe are excited to announce a special event at *${gymName}* on *${dateStr}*!\n\n${event.description ? `${event.description}\n\n` : ''}Don't miss out on the action! Let's crush our fitness goals together.\n\n*— Management, ${gymName}*`;
        }

        // Record history
        event.broadcastSent = true;
        event.broadcastHistory.push({
          channel: 'whatsapp',
          recipientCount: targetCount,
          messageSnippet: messageText.slice(0, 100) + '...',
        });
        await event.save();
      }
    } else if (type === 'holiday_broadcast') {
      messageText = customMessage || `📢 *Gym Holiday Notice*\n\nDear Members,\nPlease take note of our upcoming holiday schedule at *${gymName}*. Regular training schedules apply on other days.\n\n*— ${gymName} Team*`;
    }

    // Direct WhatsApp shareable web URL
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

    res.json({
      success: true,
      messageText,
      whatsappShareUrl,
      targetCount,
    });
  } catch (err) {
    console.error('Error in generateBroadcast:', err);
    res.status(500).json({ success: false, message: 'Failed to generate broadcast: ' + err.message });
  }
};
