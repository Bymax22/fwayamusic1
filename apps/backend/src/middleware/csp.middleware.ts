// src/middleware/csp.middleware.ts
import { Request, Response, NextFunction } from 'express';

export function CspMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self';"
  );
  next();
}
