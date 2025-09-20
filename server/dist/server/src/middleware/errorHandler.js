"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log error
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }
    // Mongoose duplicate key
    if (err.name === 'MongoError' && err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = { message, statusCode: 400 };
    }
    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err;
        switch (prismaError.code) {
            case 'P2002':
                error = { message: 'Duplicate field value entered', statusCode: 400 };
                break;
            case 'P2025':
                error = { message: 'Record not found', statusCode: 404 };
                break;
            default:
                error = { message: 'Database error', statusCode: 500 };
        }
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = { message: 'Invalid token', statusCode: 401 };
    }
    if (err.name === 'TokenExpiredError') {
        error = { message: 'Token expired', statusCode: 401 };
    }
    // Rate limit errors
    if (err.message && err.message.includes('Too many requests')) {
        error = { message: err.message, statusCode: 429 };
    }
    // CORS errors
    if (err.message && err.message.includes('CORS')) {
        error = { message: 'CORS policy violation', statusCode: 403 };
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(isDevelopment && {
            stack: err.stack,
            details: error
        }),
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method
    });
};
exports.errorHandler = errorHandler;
