"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const jwt_js_1 = require("./utils/jwt.js");
const httpServer = (0, http_1.createServer)(app_js_1.app);
exports.io = new socket_io_1.Server(httpServer, { cors: { origin: env_js_1.env.corsOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] } });
// Join per-user and per-owner rooms based on JWT provided by the client
exports.io.use((socket, next) => {
    try {
        const auth = socket.handshake.auth;
        const header = socket.handshake.headers['authorization'] || '';
        const token = (auth === null || auth === void 0 ? void 0 : auth.token) || (header.startsWith('Bearer ') ? header.slice(7) : undefined);
        if (token) {
            const payload = (0, jwt_js_1.verifyAccessToken)(token);
            // store minimal user info
            socket.data.user = { id: payload.sub, role: payload.role };
            // Every authenticated user joins their own room
            socket.join(`user:${payload.sub}`);
            // Owners also join their owner room
            if (payload.role === 'OWNER') {
                socket.join(`owner:${payload.sub}`);
            }
        }
        return next();
    }
    catch (e) {
        // Allow connection without rooms if auth fails (public connection)
        return next();
    }
});
exports.io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);
    socket.on('disconnect', () => console.log('Socket disconnected', socket.id));
});
httpServer.listen(env_js_1.env.port, () => {
    console.log(`API listening on http://localhost:${env_js_1.env.port}`);
});
