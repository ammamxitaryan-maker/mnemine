"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityLogger = exports.validateApiKey = exports.sanitizeRequest = exports.ipWhitelist = exports.requestSizeLimiter = exports.securityHeaders = void 0;
// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' wss: ws:",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);
    next();
};
exports.securityHeaders = securityHeaders;
// Request size limiter
const requestSizeLimiter = (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (contentLength > maxSize) {
        return res.status(413).json({
            error: 'Request entity too large',
            maxSize: '10MB'
        });
    }
    next();
};
exports.requestSizeLimiter = requestSizeLimiter;
// IP whitelist middleware (for admin routes)
const ipWhitelist = (allowedIPs) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        if (allowedIPs.includes(clientIP)) {
            next();
        }
        else {
            res.status(403).json({
                error: 'Access denied',
                message: 'Your IP address is not authorized'
            });
        }
    };
};
exports.ipWhitelist = ipWhitelist;
// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
    // Sanitize query parameters
    if (req.query) {
        for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = req.query[key]
                    .replace(/[<>\"'%;()&+]/g, '')
                    .trim();
            }
        }
    }
    // Sanitize body parameters
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key]
                    .replace(/[<>\"'%;()&+]/g, '')
                    .trim();
            }
        }
    }
    next();
};
exports.sanitizeRequest = sanitizeRequest;
// API key validation middleware
const validateApiKey = (req, res, next) => {
    const apiKey = req.get('X-API-Key');
    const validApiKey = process.env.API_KEY;
    if (!validApiKey) {
        return next(); // Skip if no API key is configured
    }
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({
            error: 'Invalid API key',
            message: 'API key is required and must be valid'
        });
    }
    next();
};
exports.validateApiKey = validateApiKey;
// Request logging for security monitoring
const securityLogger = (req, res, next) => {
    const startTime = Date.now();
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    // Log suspicious patterns
    const suspiciousPatterns = [
        /script/i,
        /javascript/i,
        /vbscript/i,
        /onload/i,
        /onerror/i,
        /eval/i,
        /expression/i,
        /url\(/i,
        /import/i,
        /union/i,
        /select/i,
        /insert/i,
        /update/i,
        /delete/i,
        /drop/i,
        /create/i,
        /alter/i,
        /exec/i,
        /execute/i
    ];
    const requestString = JSON.stringify({
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query,
        headers: req.headers
    });
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));
    if (isSuspicious) {
        console.warn(`[SECURITY] Suspicious request detected from ${clientIP}:`, {
            url: req.url,
            method: req.method,
            userAgent,
            timestamp: new Date().toISOString()
        });
    }
    // Log response time
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        if (statusCode >= 400) {
            console.warn(`[SECURITY] Error response from ${clientIP}:`, {
                url: req.url,
                method: req.method,
                statusCode,
                duration,
                userAgent,
                timestamp: new Date().toISOString()
            });
        }
    });
    next();
};
exports.securityLogger = securityLogger;
