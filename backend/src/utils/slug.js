'use strict';

const crypto = require('crypto');
const slugify = require('slugify');

/** Generate a slug unique within Model.slug; appends a short random suffix on collision. */
const uniqueSlug = async (Model, text, excludeId) => {
  const base = slugify(String(text || ''), { lower: true, strict: true, trim: true }) || 'item';
  let slug = base;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  }
  return slug;
};

module.exports = { uniqueSlug };
