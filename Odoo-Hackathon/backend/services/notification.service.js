const db = require('../config/db');

/**
 * Logs an activity to the activity_logs table.
 */
const logActivity = async (userId, action, entityType, entityId, details) => {
  try {
    await db.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityType, entityId, details]
    );
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

/**
 * Creates a notification for a user.
 */
const createNotification = async (userId, title, message, type = 'info', link = null) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, message, type, link]
    );
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

module.exports = { logActivity, createNotification };
