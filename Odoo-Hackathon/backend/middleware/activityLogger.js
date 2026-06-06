const db = require('../config/db');

/**
 * Auto-logging middleware — records all mutating operations to activity_logs.
 * Attach after authentication so req.user is available.
 */
const activityLogger = (entityType) => {
  return (req, res, next) => {
    // Only log mutating operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // Only log on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const entityId = req.params?.id || body?.data?.id || null;

        // Map HTTP method to action
        const actionMap = {
          POST: 'CREATE',
          PUT: 'UPDATE',
          PATCH: req.path.includes('/decide') ? (body?.data?.status === 'approved' ? 'APPROVE' : 'REJECT')
               : req.path.includes('/publish') ? 'PUBLISH'
               : req.path.includes('/status') ? 'STATUS_CHANGE'
               : 'UPDATE',
          DELETE: 'DELETE',
        };

        const action = actionMap[req.method] || req.method;

        // Build detail string
        let details = `${action} ${entityType.replace('_', ' ')}`;
        if (body?.data?.rfq_number) details += ` ${body.data.rfq_number}`;
        if (body?.data?.po_number) details += ` ${body.data.po_number}`;
        if (body?.data?.invoice_number) details += ` ${body.data.invoice_number}`;
        if (body?.data?.quotation_number) details += ` ${body.data.quotation_number}`;
        if (body?.data?.company_name) details += `: ${body.data.company_name}`;
        if (body?.data?.title) details += `: ${body.data.title}`;

        // Fire and forget — don't block the response
        if (userId) {
          db.query(
            `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, action, entityType, entityId, details]
          ).catch(err => console.error('Activity log error:', err.message));
        }
      }

      return originalJson(body);
    };

    next();
  };
};

module.exports = { activityLogger };
