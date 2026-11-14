'use strict';

const toInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Parse ?page & ?limit into safe numbers. */
const parsePagination = (query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = toInt(query.page, 1);
  const limit = Math.min(toInt(query.limit, defaultLimit), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

const buildMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
});

/**
 * Run a paginated lean query and return { docs, meta }.
 * @param {import('mongoose').Model} Model
 * @param {object} filter
 * @param {object} opts { query, sort, select, populate, defaultLimit, maxLimit }
 */
const paginate = async (Model, filter, opts = {}) => {
  const { query = {}, sort = { createdAt: -1 }, select, populate, defaultLimit, maxLimit } = opts;
  const { page, limit, skip } = parsePagination(query, { defaultLimit, maxLimit });

  let q = Model.find(filter).sort(sort).skip(skip).limit(limit);
  if (select) q = q.select(select);
  if (populate) q = q.populate(populate);

  const [docs, total] = await Promise.all([q.lean(), Model.countDocuments(filter)]);
  return { docs, meta: buildMeta(page, limit, total) };
};

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { parsePagination, buildMeta, paginate, escapeRegex };
