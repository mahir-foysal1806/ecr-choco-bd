'use strict';

const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

const isValidBdPhone = (value) => BD_PHONE_REGEX.test(String(value || '').replace(/[\s-]/g, ''));

/** Normalize to local 11 digit format: 01XXXXXXXXX */
const normalizePhone = (value) => {
  const cleaned = String(value || '').replace(/[\s-]/g, '');
  return cleaned.replace(/^\+?88/, '');
};

/** Normalize to international digits for hashing: 8801XXXXXXXXX */
const toInternationalPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^01\d{9}$/.test(digits)) return `88${digits}`;
  return digits;
};

module.exports = { isValidBdPhone, normalizePhone, toInternationalPhone };
