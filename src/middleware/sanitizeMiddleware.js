const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;"); // basic XSS mitigation
};

// Recursively sanitize all strings in an object or array
const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  if (typeof data === 'object' && data !== null) {
    const sanitizedObj = {};
    for (const key in data) {
      sanitizedObj[key] = sanitizeData(data[key]);
    }
    return sanitizedObj;
  }
  return data;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizeData(req.body);
  if (req.query) req.query = sanitizeData(req.query);
  if (req.params) req.params = sanitizeData(req.params);
  next();
};

module.exports = sanitizeRequest;
