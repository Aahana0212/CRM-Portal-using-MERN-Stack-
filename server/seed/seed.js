/* Seeds the database with demo users, customers, deals and tasks.
   Run: npm run seed */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const Task = require('../models/Task');

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(11, 0, 0, 0);
  return d;
};
const monthsAgo = (n, day = 12) => {
  const d = new Date();
  d.setDate(day);
  d.setMonth(d.getMonth() - n);
  return d;
};

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crm_portal';
  await mongoose.connect(uri);
  console.log('Connected to', uri);

  await Promise.all([User.deleteMany(), Customer.deleteMany(), Deal.deleteMany(), Task.deleteMany()]);

  const [admin, rahul, priya] = await User.create([
    { name: 'Admin User', email: 'admin@crm.com', password: 'admin123', role: 'admin', phone: '9876500001' },
    { name: 'Rahul Sharma', email: 'rahul@crm.com', password: 'sales123', role: 'sales', phone: '9876500002' },
    { name: 'Priya Verma', email: 'priya@crm.com', password: 'sales123', role: 'sales', phone: '9876500003' },
  ]);

  const customerData = [
    ['Himalayan Organics', 'Ankit Rawat', 'ankit@himalayanorganics.in', 'customer', 'active', 'referral', rahul],
    ['Doon Valley School', 'Meera Joshi', 'meera@doonvalley.edu.in', 'customer', 'active', 'website', priya],
    ['Rishikesh Retreats', 'Vikas Negi', 'vikas@rishikeshretreats.com', 'lead', 'qualified', 'social', rahul],
    ['Mussoorie Bakers', 'Sana Khan', 'sana@mussooriebakers.in', 'lead', 'contacted', 'call', priya],
    ['Uttarakhand Tours', 'Rohit Bisht', 'rohit@uktours.in', 'customer', 'active', 'event', rahul],
    ['GreenLeaf Pharma', 'Neha Gupta', 'neha@greenleafpharma.com', 'lead', 'new', 'email', priya],
    ['Nainital Handicrafts', 'Deepak Pant', 'deepak@nainitalcrafts.in', 'lead', 'new', 'website', rahul],
    ['Haridwar Logistics', 'Amit Saini', 'amit@hdlogistics.in', 'customer', 'active', 'referral', priya],
    ['Clock Tower Cafe', 'Pooja Thapa', 'pooja@clocktowercafe.in', 'lead', 'lost', 'social', rahul],
    ['Garhwal Motors', 'Sunil Rana', 'sunil@garhwalmotors.com', 'lead', 'qualified', 'call', priya],
  ];

  const customers = await Customer.create(
    customerData.map(([company, name, email, type, status, source, owner], i) => ({
      company,
      name,
      email,
      phone: `98370${String(10000 + i * 137).slice(0, 5)}`,
      address: 'Dehradun, Uttarakhand',
      type,
      status,
      source,
      assignedTo: owner._id,
      createdBy: admin._id,
      notes: [{ text: `Initial discussion done with ${name}.`, author: owner._id }],
    }))
  );
  const C = (company) => customers.find((c) => c.company === company);

  const dealData = [
    ['E-commerce Website', 'Himalayan Organics', 185000, 'won', rahul, monthsAgo(4)],
    ['School Management Portal', 'Doon Valley School', 320000, 'won', priya, monthsAgo(3)],
    ['Booking Website + SEO', 'Rishikesh Retreats', 140000, 'negotiation', rahul],
    ['Online Ordering App', 'Mussoorie Bakers', 90000, 'proposal', priya],
    ['Tour Package CRM', 'Uttarakhand Tours', 210000, 'won', rahul, monthsAgo(1)],
    ['Inventory System', 'GreenLeaf Pharma', 275000, 'qualification', priya],
    ['Product Catalogue Site', 'Nainital Handicrafts', 60000, 'prospecting', rahul],
    ['Fleet Tracking Dashboard', 'Haridwar Logistics', 400000, 'won', priya, monthsAgo(0, 3)],
    ['Cafe Website', 'Clock Tower Cafe', 35000, 'lost', rahul, monthsAgo(2)],
    ['Dealer Portal', 'Garhwal Motors', 230000, 'proposal', priya],
    ['SEO Retainer (Annual)', 'Himalayan Organics', 120000, 'won', rahul, monthsAgo(2)],
    ['Mobile App Phase 2', 'Haridwar Logistics', 180000, 'negotiation', priya],
  ];

  const deals = [];
  for (const [title, company, value, stage, owner, closedAt] of dealData) {
    const deal = new Deal({
      title,
      customer: C(company)._id,
      value,
      stage,
      assignedTo: owner._id,
      createdBy: admin._id,
      expectedCloseDate: closedAt || daysFromNow(15 + deals.length * 4),
      description: `${title} for ${company}`,
    });
    await deal.save();
    if (closedAt) {
      // backdate closed deals so the revenue chart has history
      await Deal.updateOne({ _id: deal._id }, { $set: { closedAt } }, { timestamps: false });
    }
    deals.push(deal);
  }

  const taskData = [
    ['Call Vikas about final pricing', 'call', 'high', 'pending', 0, 'Rishikesh Retreats', rahul],
    ['Send proposal PDF to Sana', 'email', 'high', 'pending', -1, 'Mussoorie Bakers', priya],
    ['Demo meeting with GreenLeaf team', 'meeting', 'medium', 'pending', 2, 'GreenLeaf Pharma', priya],
    ['Follow up on catalogue requirements', 'follow-up', 'low', 'pending', 4, 'Nainital Handicrafts', rahul],
    ['Collect feedback on fleet dashboard', 'call', 'medium', 'completed', -3, 'Haridwar Logistics', priya],
    ['Negotiate payment terms', 'meeting', 'high', 'in-progress', 1, 'Haridwar Logistics', priya],
    ['Share dealer portal wireframes', 'email', 'medium', 'pending', 0, 'Garhwal Motors', priya],
    ['Monthly SEO report', 'email', 'low', 'completed', -5, 'Himalayan Organics', rahul],
    ['Check-in call with Uttarakhand Tours', 'follow-up', 'low', 'pending', 6, 'Uttarakhand Tours', rahul],
  ];

  await Task.create(
    taskData.map(([title, type, priority, status, due, company, owner]) => ({
      title,
      type,
      priority,
      status,
      dueDate: daysFromNow(due),
      customer: C(company)._id,
      assignedTo: owner._id,
      createdBy: admin._id,
    }))
  );

  console.log('\n✅ Seed complete. Login credentials:');
  console.log('   Admin : admin@crm.com / admin123');
  console.log('   Sales : rahul@crm.com / sales123');
  console.log('   Sales : priya@crm.com / sales123\n');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
