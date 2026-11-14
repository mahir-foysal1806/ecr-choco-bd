'use strict';

const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

/** Format: ECR-YYMMDD-XXXX (date in Asia/Dhaka). */
const generateOrderNumber = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  const stamp = `${get('year')}${get('month')}${get('day')}`;

  const bytes = crypto.randomBytes(4);
  let suffix = '';
  for (let i = 0; i < 4; i += 1) suffix += ALPHABET[bytes[i] % ALPHABET.length];
  return `ECR-${stamp}-${suffix}`;
};

module.exports = generateOrderNumber;
