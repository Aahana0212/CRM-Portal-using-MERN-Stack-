const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { ownershipFilter, pick } = require('../utils/scope');

const FIELDS = ['title', 'description', 'type', 'priority', 'status', 'dueDate', 'customer', 'deal', 'assignedTo'];
const populate = (q) =>
  q.populate('customer', 'name company').populate('deal', 'title').populate('assignedTo', 'name');

// GET /api/tasks?status=&priority=&due=today|overdue|upcoming
exports.getTasks = asyncHandler(async (req, res) => {
  const filter = { ...ownershipFilter(req.user) };
  const { status, priority, due, customer } = req.query;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (customer) filter.customer = customer;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  if (due === 'today') filter.dueDate = { $gte: start, $lt: end };
  if (due === 'overdue') Object.assign(filter, { dueDate: { $lt: start }, status: { $ne: 'completed' } });
  if (due === 'upcoming') filter.dueDate = { $gte: end };

  const tasks = await populate(Task.find(filter)).sort({ status: 1, dueDate: 1 });
  res.json(tasks);
});

// POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (req.user.role !== 'admin' || !data.assignedTo) data.assignedTo = req.user._id;
  const task = await Task.create({ ...data, createdBy: req.user._id });
  res.status(201).json(await populate(Task.findById(task._id)));
});

// PUT /api/tasks/:id
exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ...ownershipFilter(req.user) });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const data = pick(req.body, FIELDS);
  if (req.user.role !== 'admin') delete data.assignedTo;
  Object.assign(task, data);
  await task.save();
  res.json(await populate(Task.findById(task._id)));
});

// DELETE /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, ...ownershipFilter(req.user) });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Task deleted' });
});
