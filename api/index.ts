import app from '../server/index.js';
import { initializeDatabase } from '../server/db.js';

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    try {
      await initializeDatabase();
    } catch (e) {
      console.warn('[Vercel Serverless] DB initialization note:', e);
    }
    initialized = true;
  }
  return app(req, res);
}
