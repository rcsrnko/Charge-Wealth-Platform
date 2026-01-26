import rateLimit from 'express-rate-limit';

// Standard API rate limiter - 100 requests per minute
export const standardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for AI endpoints - 20 requests per minute
// This protects against OpenAI API cost abuse
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'AI request limit reached. Please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict limiter for expensive operations - 5 per minute
export const expensiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Request limit reached for this operation. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter - prevent brute force - 10 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
