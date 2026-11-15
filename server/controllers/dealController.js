const Deal = require('../models/Deal');
const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');
const { ownershipFilter, pick } = require('../utils/scope');

const FIELDS = ['title', 'customer', 'value', 'stage', 'expectedCloseDate', 'description', 'assignedTo'];
const populate = (q) => q.populate('customer', 'name company email').populate('assignedTo', 'name email');

// GET /api/deals?stage=&search=
exports.getDeals = asyncHandler(async (req, res) => {
  const filter = { ...ownershipFilter(req.user) };
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.customer) filter.customer = req.query.customer;
  if (req.query.search) filter.title = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const deals = await populate(Deal.find(filter)).sort({ updatedAt: -1 });
  res.json(deals);
});

// GET /api/deals/pipeline  -> deals grouped by stage with totals
exports.getPipeline = asyncHandler(async (req, res) => {
  const deals = await populate(Deal.find(ownershipFilter(req.user))).sort({ updatedAt: -1 });
  const pipeline = Deal.STAGES.map((stage) => {
    const items = deals.filter((d) => d.stage === stage);
    return { stage, count: items.length, total: items.reduce((s, d) => s + d.value, 0), deals: items };
  });
  res.json(pipeline);
});

// GET /api/deals/:id
exports.getDeal = asyncHandler(async (req, res) => {
  const deal = await populate(Deal.findOne({ _id: req.params.id, ...ownershipFilter(req.user) }));
  if (!deal) return res.status(404).json({ message: 'Deal not found' });
  res.json(deal);
});

// POST /api/deals
exports.createDeal = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  const customer = await Customer.findOne({ _id: data.customer, ...ownershipFilter(req.user) });
  if (!customer) return res.status(400).json({ message: 'Valid customer is required' });
  if (req.user.role !== 'admin' || !data.assignedTo) data.assignedTo = req.user._id;
  const deal = new Deal({ ...data, createdBy: req.user._id });
  deal.probability = Deal.STAGE_PROB[deal.stage];
  await deal.save();
  res.status(201).json(await populate(Deal.findById(deal._id)));
});

// PUT /api/deals/:id
exports.updateDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne({ _id: req.params.id, ...ownershipFilter(req.user) });
  if (!deal) return res.status(404).json({ message: 'Deal not found' });
  const data = pick(req.body, FIELDS);
  if (req.user.role !== 'admin') delete data.assignedTo;
  Object.assign(deal, data);
  await deal.save();

  // Winning a deal converts the lead into a customer automatically
  if (deal.stage === 'won') {
    await Customer.updateOne({ _id: deal.customer, type: 'lead' }, { type: 'customer', status: 'active' });
  }
  res.json(await populate(Deal.findById(deal._id)));
});

// PATCH /api/deals/:id/stage  (used by drag & drop pipeline)
exports.updateStage = (req, res, next) => {
  req.body = { stage: req.body.stage };
  return exports.updateDeal(req, res, next);
};

// DELETE /api/deals/:id
exports.deleteDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findOneAndDelete({ _id: req.params.id, ...ownershipFilter(req.user) });
  if (!deal) return res.status(404).json({ message: 'Deal not found' });
  res.json({ message: 'Deal deleted' });
});
