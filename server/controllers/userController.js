const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { pick } = require('../utils/scope');

// GET /api/users  (admin: all users, sales: active users list for assignment dropdowns)
exports.getUsers = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { isActive: true };
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json(users);
});

// POST /api/users  (admin)
exports.createUser = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['name', 'email', 'password', 'role', 'phone', 'isActive']);
  const user = await User.create(data);
  res.status(201).json(user);
});

// PUT /api/users/:id  (admin)
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const data = pick(req.body, ['name', 'email', 'role', 'phone', 'isActive', 'password']);
  if (String(user._id) === String(req.user._id) && (data.role === 'sales' || data.isActive === false)) {
    return res.status(400).json({ message: 'You cannot demote or deactivate your own account' });
  }
  if (!data.password) delete data.password;
  Object.assign(user, data);
  await user.save();
  res.json(user);
});

// DELETE /api/users/:id  (admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
});
