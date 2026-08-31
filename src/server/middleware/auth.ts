import type { Request, Response, NextFunction } from 'express';

export function requireProxyApiKey(req: Request, res: Response, next: NextFunction): void {
  const proxyApiKey = process.env.PROXY_API_KEY;
  
  if (!proxyApiKey) {
    // If no proxy API key is configured, allow all requests (development mode)
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        message: 'Missing or invalid Authorization header',
        type: 'authentication_error',
        code: 'missing_api_key',
      },
    });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== proxyApiKey) {
    res.status(403).json({
      error: {
        message: 'Invalid API key',
        type: 'authentication_error',
        code: 'invalid_api_key',
      },
    });
    return;
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    // If no admin password is configured, allow all requests (development mode)
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        message: 'Admin authentication required',
        type: 'authentication_error',
        code: 'missing_admin_key',
      },
    });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== adminPassword) {
    res.status(403).json({
      error: {
        message: 'Invalid admin credentials',
        type: 'authentication_error',
        code: 'invalid_admin_key',
      },
    });
    return;
  }

  next();
}
