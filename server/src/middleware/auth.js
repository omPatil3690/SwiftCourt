"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRoles = requireRoles;
const jwt_js_1 = require("../utils/jwt.js");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header)
        return res.status(401).json({ message: 'Missing Authorization header' });
    const token = header.replace('Bearer ', '');
    try {
        const payload = (0, jwt_js_1.verifyAccessToken)(token);
        req.user = { id: payload.sub, role: payload.role };
        next();
    }
    catch (e) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}
function requireRoles(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthenticated' });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ message: 'Forbidden' });
        next();
    };
}
