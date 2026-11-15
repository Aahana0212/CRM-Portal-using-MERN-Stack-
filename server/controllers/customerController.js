const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { ownershipFilter, pick } = require('../utils/scope');

const FIELDS = ['name', 'email', 'phone', 'company', 'address', 'type', 'status', 'source', 'assignedTo'];

// GET /api/customers?search=&type=&status=&source=&page=&limit=
exports.getCustomers = asyncHandler(async (req, res) => {
  const { search, type, status, source, page = 1, limit = 50 } = req.query;
  const filter = { ...ownershipFilter(req.user) };
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$and = [{ $or: [{ name: rx }, { email: rx }, { company: rx }, { phone: rx }] }];
  }

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Customer.countDocuments(filter),
  ]);
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// GET /api/customers/:id  (with related deals & tasks)
exports.getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, ...ownershipFilter(req.user) })
    .populate('assignedTo', 'name email')
    .populate('notes.author', 'name');
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  const [deals, tasks] = await Promise.all([
    Deal.find({ customer: customer._id }).populate('assignedTo', 'name').sort({ createdAt: -1 }),
    Task.find({ customer: customer._id }).populate('assignedTo', 'name').sort({ dueDate: 1 }),
  ]);
  res.json({ customer, deals, tasks });
});

// POST /api/customers
exports.createCustomer = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  // Sales executives can only create records for themselves; admin may assign to anyone
  if (req.user.role !== 'admin' || !data.assignedTo) data.assignedTo = req.user._id;
  const customer = await Customer.create({ ...data, createdBy: req.user._id });
  res.status(201).json(await customer.populate('assignedTo', 'name email'));
});

// PUT /api/customers/:id
exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, ...ownershipFilter(req.user) });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  const data = pick(req.body, FIELDS);
  if (req.user.role !== 'admin') delete data.assignedTo;
  Object.assign(customer, data);
  await customer.save();
  res.json(await customer.populate('assignedTo', 'name email'));
});

// PATCH /api/customers/:id/convert  -> lead becomes customer
exports.convertLead = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, ...ownershipFilter(req.user) });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  customer.type = 'customer';
  customer.status = 'active';
  await customer.save();
  res.json(customer);
});

// POST /api/customers/:id/notes
exports.addNote = asyncHandler(async (req, res) => {
  if (!req.body.text) return res.status(400).json({ message: 'Note text is required' });
  const customer = await Customer.findOne({ _id: req.params.id, ...ownershipFilter(req.user) });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  customer.notes.unshift({ text: req.body.text, author: req.user._id });
  await customer.save();
  await customer.populate('notes.author', 'name');
  res.status(201).json(customer.notes);
});

// DELETE /api/customers/:id  (admin only) - also removes related deals & tasks
exports.deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  await Promise.all([Deal.deleteMany({ customer: customer._id }), Task.deleteMany({ customer: customer._id })]);
  res.json({ message: 'Customer and related records deleted' });
});
