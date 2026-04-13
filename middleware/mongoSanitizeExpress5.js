import mongoSanitize from 'express-mongo-sanitize';

const { sanitize } = mongoSanitize;

/**
 * express-mongo-sanitize assigns req.query after sanitizing. In Express 5,
 * req.query is getter-only, so assignment throws. We sanitize the parsed
 * object in place, then set it with defineProperty when assignment fails.
 */
export default function mongoSanitizeExpress5(options = {}) {
  return function mongoSanitizeMiddleware(req, res, next) {
    ['body', 'params', 'headers'].forEach(function (key) {
      if (req[key]) {
        req[key] = sanitize(req[key], options);
      }
    });

    if (req.query) {
      const q = req.query;
      sanitize(q, options);
      try {
        req.query = q;
      } catch {
        Object.defineProperty(req, 'query', {
          value: q,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }

    next();
  };
}
