'use strict';

/** Send a success envelope: { success: true, data?, message?, meta? } */
const sendSuccess = (res, data, { status = 200, message, meta } = {}) => {
  const body = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};

module.exports = { sendSuccess };
