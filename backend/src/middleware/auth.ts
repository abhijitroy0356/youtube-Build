import jwt from 'jsonwebtoken'
import { Request } from 'express'
import logger from '../util/logger'

const JWT_SECRET = process.env.JWT_SECRET || ""
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env")
}

export function generatedToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET)
}

export function getUserId(req: Request): string | null {
  const auth = req.headers.authorization;

  // 1. Quick exit if no header or wrong format
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }

  // 2. Fail loud if the server is misconfigured (Secret missing)
  if (!JWT_SECRET) {
    logger.error("JWT_SECRET is not defined in environment variables!");
    return null;
  }

  const token = auth.split(' ')[1];

  try {
    // 3. Verify and cast in one go
    const payload = jwt.verify(token, JWT_SECRET) as {userId: string}
    
    // 4. Double check the property exists (Defensive)
    if (!payload.userId) {
      logger.warn({ payload }, "JWT valid but missing userId");
      return null;
    }

    return payload.userId;
  } catch (error) {
    // 5. Log the reason (Expired vs. Malformed)
    logger.debug({ error: error instanceof Error ? error.message : error }, "JWT Verification failed");
    return null;
  }
}