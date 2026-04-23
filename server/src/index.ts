import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { env } from './config/env.js';
import { verifyAccessToken } from './utils/jwt.js';

const httpServer = createServer(app);
export const io = new Server(httpServer, { cors: { origin: env.corsOrigin as any, credentials: true, methods: ['GET','POST','PUT','DELETE','OPTIONS'] } });

// Join per-user and per-owner rooms based on JWT provided by the client
io.use((socket, next) => {
  try {
    const auth = socket.handshake.auth as any;
    const header = (socket.handshake.headers['authorization'] as string) || '';
    const token = auth?.token || (header.startsWith('Bearer ') ? header.slice(7) : undefined);
    if (token) {
      const payload = verifyAccessToken(token);
      // store minimal user info
      (socket.data as any).user = { id: payload.sub, role: payload.role };
      // Every authenticated user joins their own room
      socket.join(`user:${payload.sub}`);
      // Owners also join their owner room
      if (payload.role === 'OWNER') {
        socket.join(`owner:${payload.sub}`);
      }
    }
    return next();
  } catch (e) {
    // Allow connection without rooms if auth fails (public connection)
    return next();
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected', socket.id));
});

httpServer.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
