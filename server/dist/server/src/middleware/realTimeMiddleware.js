"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataFreshnessMiddleware = exports.rateLimitMiddleware = exports.realTimeMiddleware = void 0;
// Real-time data synchronization middleware
const realTimeMiddleware = (req, res, next) => {
    // Add real-time headers for better caching control
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Add ETag for conditional requests
    const etag = `"${Date.now()}-${Math.random()}"`;
    res.setHeader('ETag', etag);
    // Check if client has the same ETag (conditional request)
    if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
    }
    next();
};
exports.realTimeMiddleware = realTimeMiddleware;
// Rate limiting for real-time endpoints
const rateLimitMap = new Map();
const rateLimitMiddleware = (maxRequests = 100, windowMs = 60000) => {
    return (req, res, next) => {
        const clientId = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const clientData = rateLimitMap.get(clientId);
        if (!clientData || now > clientData.resetTime) {
            // Reset or create new entry
            rateLimitMap.set(clientId, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }
        if (clientData.count >= maxRequests) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
            });
        }
        clientData.count++;
        next();
    };
};
exports.rateLimitMiddleware = rateLimitMiddleware;
// Data freshness middleware
const dataFreshnessMiddleware = (maxAgeMs = 30000) => {
    return (req, res, next) => {
        const lastModified = new Date(Date.now() - maxAgeMs).toUTCString();
        res.setHeader('Last-Modified', lastModified);
        // Check if client has fresh data
        const ifModifiedSince = req.headers['if-modified-since'];
        if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified)) {
            return res.status(304).end();
        }
        next();
    };
};
exports.dataFreshnessMiddleware = dataFreshnessMiddleware;
