// Admin sees everything; a Sales Executive sees only records assigned to / created by them.
const ownershipFilter = (user) =>
  user.role === 'admin' ? {} : { $or: [{ assignedTo: user._id }, { createdBy: user._id }] };

// Pick only allowed keys from request body
const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k] === '' ? undefined : obj[k];
    return acc;
  }, {});

module.exports = { ownershipFilter, pick };
