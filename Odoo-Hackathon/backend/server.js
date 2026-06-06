const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Routes ─────────────────────────────────────────────────
const { activityLogger } = require('./middleware/activityLogger');

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/vendors', activityLogger('vendor'), require('./routes/vendor.routes'));
app.use('/api/rfqs', activityLogger('rfq'), require('./routes/rfq.routes'));
app.use('/api/quotations', activityLogger('quotation'), require('./routes/quotation.routes'));
app.use('/api/approvals', activityLogger('approval'), require('./routes/approval.routes'));
app.use('/api/purchase-orders', activityLogger('purchase_order'), require('./routes/purchaseOrder.routes'));
app.use('/api/invoices', activityLogger('invoice'), require('./routes/invoice.routes'));
app.use('/api/activity-logs', require('./routes/activity.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/users', activityLogger('user'), require('./routes/user.routes'));

// ─── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler ──────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n🚀 VendorBridge API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Frontend:    ${config.frontendUrl}\n`);
});

module.exports = app;
