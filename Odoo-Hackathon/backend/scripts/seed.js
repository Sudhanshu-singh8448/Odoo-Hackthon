const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('password123', salt);

    // Create users for each role
    const users = await db.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
        ('Admin User', 'admin@vendorbridge.com', $1, 'admin'),
        ('John Procurement', 'officer@vendorbridge.com', $1, 'procurement_officer'),
        ('Sarah Manager', 'manager@vendorbridge.com', $1, 'manager'),
        ('Vendor Alpha', 'vendor1@example.com', $1, 'vendor'),
        ('Vendor Beta', 'vendor2@example.com', $1, 'vendor'),
        ('Vendor Gamma', 'vendor3@example.com', $1, 'vendor')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email, role
    `, [hash]);

    console.log(`   Created ${users.rows.length} users`);

    if (users.rows.length === 0) {
      console.log('   Users already exist, fetching...');
      const existingUsers = await db.query("SELECT id, name, email, role FROM users");
      users.rows = existingUsers.rows;
    }

    const getUser = (role) => users.rows.find(u => u.role === role);
    const vendors_users = users.rows.filter(u => u.role === 'vendor');

    // Create vendors
    const vendorData = [
      { company: 'Alpha Tech Solutions', contact: 'Rajesh Kumar', email: 'vendor1@example.com', gst: '29ABCDE1234F1Z5', category: 'IT Services', city: 'Bangalore', state: 'Karnataka', user_id: vendors_users[0]?.id },
      { company: 'Beta Office Supplies', contact: 'Priya Sharma', email: 'vendor2@example.com', gst: '27FGHIJ5678K1Z3', category: 'Office Supplies', city: 'Mumbai', state: 'Maharashtra', user_id: vendors_users[1]?.id },
      { company: 'Gamma Manufacturing', contact: 'Amit Patel', email: 'vendor3@example.com', gst: '24KLMNO9012P1Z8', category: 'Manufacturing', city: 'Ahmedabad', state: 'Gujarat', user_id: vendors_users[2]?.id },
      { company: 'Delta Logistics', contact: 'Sneha Reddy', email: 'delta@example.com', gst: '36QRSTU3456V1Z1', category: 'Logistics', city: 'Hyderabad', state: 'Telangana' },
      { company: 'Epsilon Security', contact: 'Vikram Singh', email: 'epsilon@example.com', gst: '07VWXYZ7890A1Z6', category: 'Security', city: 'Delhi', state: 'Delhi' },
    ];

    const vendorIds = [];
    for (const v of vendorData) {
      const result = await db.query(
        `INSERT INTO vendors (company_name, contact_person, email, gst_number, category, city, state, user_id, rating, address, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT DO NOTHING RETURNING id`,
        [v.company, v.contact, v.email, v.gst, v.category, v.city, v.state, v.user_id || null,
         (Math.random() * 2 + 3).toFixed(2), `${Math.floor(Math.random()*999)+1}, Business Park, ${v.city}`, `+91 ${Math.floor(Math.random()*9000000000)+1000000000}`]
      );
      if (result.rows.length > 0) vendorIds.push(result.rows[0].id);
    }

    console.log(`   Created ${vendorIds.length} vendors`);

    if (vendorIds.length >= 3) {
      const officer = getUser('procurement_officer') || getUser('admin');

      // Create RFQs
      const rfq1 = await db.query(
        `INSERT INTO rfqs (rfq_number, title, description, created_by, deadline, status, priority)
         VALUES ('RFQ-2026-00001', 'Office IT Equipment Q3', 'Procurement of laptops, monitors and peripherals for new hires', $1, '2026-07-15', 'open', 'high')
         RETURNING id`, [officer.id]
      );

      const rfq2 = await db.query(
        `INSERT INTO rfqs (rfq_number, title, description, created_by, deadline, status, priority)
         VALUES ('RFQ-2026-00002', 'Office Stationery Monthly Supply', 'Monthly office supplies including paper, pens, and folders', $1, '2026-06-30', 'open', 'medium')
         RETURNING id`, [officer.id]
      );

      const rfq3 = await db.query(
        `INSERT INTO rfqs (rfq_number, title, description, created_by, deadline, status, priority)
         VALUES ('RFQ-2026-00003', 'Security Camera Installation', 'Installation of CCTV cameras at new office building', $1, '2026-08-01', 'draft', 'low')
         RETURNING id`, [officer.id]
      );

      // Add RFQ items
      const items1 = await db.query(
        `INSERT INTO rfq_items (rfq_id, product_name, specification, quantity, unit) VALUES
          ($1, 'Laptop', '14-inch, i7, 16GB RAM, 512GB SSD', 25, 'units'),
          ($1, 'Monitor', '27-inch 4K IPS Display', 25, 'units'),
          ($1, 'Keyboard & Mouse', 'Wireless combo set', 25, 'sets')
         RETURNING id`, [rfq1.rows[0].id]
      );

      const items2 = await db.query(
        `INSERT INTO rfq_items (rfq_id, product_name, specification, quantity, unit) VALUES
          ($1, 'A4 Paper', '80 GSM, 500 sheets per ream', 100, 'reams'),
          ($1, 'Ballpoint Pens', 'Blue ink, pack of 10', 50, 'packs'),
          ($1, 'File Folders', 'A4 size, assorted colors', 200, 'pieces')
         RETURNING id`, [rfq2.rows[0].id]
      );

      // Assign vendors to RFQs
      await db.query(`INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES ($1, $2), ($1, $3)`,
        [rfq1.rows[0].id, vendorIds[0], vendorIds[2]]);
      await db.query(`INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES ($1, $2), ($1, $3)`,
        [rfq2.rows[0].id, vendorIds[1], vendorIds[0]]);

      // Submit quotation from vendor 1 for RFQ 1
      const qt1 = await db.query(
        `INSERT INTO quotations (quotation_number, rfq_id, vendor_id, total_amount, delivery_days, notes, status)
         VALUES ('QT-2026-00001', $1, $2, 2875000, 14, 'Best pricing for bulk order. Free installation included.', 'submitted')
         RETURNING id`, [rfq1.rows[0].id, vendorIds[0]]
      );

      // Add quotation items
      for (let i = 0; i < items1.rows.length; i++) {
        const prices = [75000, 35000, 5000];
        await db.query(
          `INSERT INTO quotation_items (quotation_id, rfq_item_id, unit_price, quantity, total_price)
           VALUES ($1, $2, $3, 25, $4)`,
          [qt1.rows[0].id, items1.rows[i].id, prices[i], prices[i] * 25]
        );
      }

      // Submit quotation from vendor 3 for RFQ 1
      const qt2 = await db.query(
        `INSERT INTO quotations (quotation_number, rfq_id, vendor_id, total_amount, delivery_days, notes, status)
         VALUES ('QT-2026-00002', $1, $2, 3125000, 10, 'Premium quality with 2-year warranty. Express delivery available.', 'submitted')
         RETURNING id`, [rfq1.rows[0].id, vendorIds[2]]
      );

      for (let i = 0; i < items1.rows.length; i++) {
        const prices = [82000, 38000, 5000];
        await db.query(
          `INSERT INTO quotation_items (quotation_id, rfq_item_id, unit_price, quantity, total_price)
           VALUES ($1, $2, $3, 25, $4)`,
          [qt2.rows[0].id, items1.rows[i].id, prices[i], prices[i] * 25]
        );
      }

      // Add some activity logs
      await db.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES
          ($1, 'CREATE', 'rfq', $2, 'RFQ created: Office IT Equipment Q3'),
          ($1, 'PUBLISH', 'rfq', $2, 'RFQ published and vendors invited'),
          ($1, 'CREATE', 'rfq', $3, 'RFQ created: Office Stationery Monthly Supply'),
          ($1, 'PUBLISH', 'rfq', $3, 'RFQ published and vendors invited')`,
        [officer.id, rfq1.rows[0].id, rfq2.rows[0].id]
      );

      console.log('   Created 3 RFQs with items, vendor assignments, and quotations');
    }

    console.log('✅ Seeding completed!\n');
    console.log('📋 Login Credentials:');
    console.log('   Admin:     admin@vendorbridge.com / password123');
    console.log('   Officer:   officer@vendorbridge.com / password123');
    console.log('   Manager:   manager@vendorbridge.com / password123');
    console.log('   Vendor 1:  vendor1@example.com / password123');
    console.log('   Vendor 2:  vendor2@example.com / password123');
    console.log('   Vendor 3:  vendor3@example.com / password123\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
