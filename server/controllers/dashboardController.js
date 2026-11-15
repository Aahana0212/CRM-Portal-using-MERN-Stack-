const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ownershipFilter } = require('../utils/scope');

// GET /api/dashboard/stats
exports.getStats = asyncHandler(async (req, res) => {
  const scope = ownershipFilter(req.user);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [customers, leads, deals, tasksToday, overdue, recentCustomers, upcomingTasks] = await Promise.all([
    Customer.countDocuments({ ...scope, type: 'customer' }),
    Customer.countDocuments({ ...scope, type: 'lead' }),
    Deal.find(scope).select('stage value updatedAt closedAt'),
    Task.countDocuments({ ...scope, dueDate: { $gte: today, $lt: tomorrow }, status: { $ne: 'completed' } }),
    Task.countDocuments({ ...scope, dueDate: { $lt: today }, status: { $ne: 'completed' } }),
    Customer.find(scope).sort({ createdAt: -1 }).limit(5).select('name company type status createdAt'),
    Task.find({ ...scope, status: { $ne: 'completed' } })
      .sort({ dueDate: 1 })
      .limit(6)
      .populate('customer', 'name'),
  ]);

  const open = deals.filter((d) => !['won', 'lost'].includes(d.stage));
  const won = deals.filter((d) => d.stage === 'won');
  const lost = deals.filter((d) => d.stage === 'lost');
  const closed = won.length + lost.length;

  const pipeline = Deal.STAGES.map((stage) => {
    const s = deals.filter((d) => d.stage === stage);
    return { stage, count: s.length, value: s.reduce((a, d) => a + d.value, 0) };
  });

  // Revenue (won deals) for last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }), revenue: 0, deals: 0 });
  }
  won.forEach((d) => {
    const dt = d.closedAt || d.updatedAt;
    const m = months.find((x) => x.key === `${dt.getFullYear()}-${dt.getMonth()}`);
    if (m) {
      m.revenue += d.value;
      m.deals += 1;
    }
  });

  res.json({
    counts: {
      customers,
      leads,
      openDeals: open.length,
      pipelineValue: open.reduce((a, d) => a + d.value, 0),
      wonValue: won.reduce((a, d) => a + d.value, 0),
      winRate: closed ? Math.round((won.length / closed) * 100) : 0,
      tasksToday,
      overdue,
    },
    pipeline,
    revenue: months.map(({ label, revenue, deals }) => ({ month: label, revenue, deals })),
    recentCustomers,
    upcomingTasks,
  });
});

// GET /api/dashboard/reports  (admin) - performance per sales executive + lead sources
exports.getReports = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true }).select('name role');
  const [deals, customers, tasks] = await Promise.all([
    Deal.find().select('stage value assignedTo'),
    Customer.find().select('source type assignedTo'),
    Task.find().select('status assignedTo'),
  ]);

  const byUser = users.map((u) => {
    const id = String(u._id);
    const ud = deals.filter((d) => String(d.assignedTo) === id);
    const won = ud.filter((d) => d.stage === 'won');
    const lost = ud.filter((d) => d.stage === 'lost');
    const ut = tasks.filter((t) => String(t.assignedTo) === id);
    return {
      _id: u._id,
      name: u.name,
      role: u.role,
      customers: customers.filter((c) => String(c.assignedTo) === id).length,
      totalDeals: ud.length,
      wonDeals: won.length,
      wonValue: won.reduce((a, d) => a + d.value, 0),
      winRate: won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0,
      tasksCompleted: ut.filter((t) => t.status === 'completed').length,
      tasksPending: ut.filter((t) => t.status !== 'completed').length,
    };
  });

  const sourceMap = {};
  customers.forEach((c) => {
    sourceMap[c.source] = sourceMap[c.source] || { source: c.source, leads: 0, customers: 0 };
    sourceMap[c.source][c.type === 'lead' ? 'leads' : 'customers'] += 1;
  });

  res.json({ byUser, sources: Object.values(sourceMap) });
});
