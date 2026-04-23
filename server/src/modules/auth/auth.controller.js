"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupHandler = signupHandler;
exports.verifyOtpHandler = verifyOtpHandler;
exports.loginHandler = loginHandler;
exports.refreshHandler = refreshHandler;
exports.logoutHandler = logoutHandler;
const zod_1 = require("zod");
const auth_service_js_1 = require("./auth.service.js");
const enums_js_1 = require("../../types/enums.js");
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    fullName: zod_1.z.string().min(2),
    role: zod_1.z.nativeEnum(enums_js_1.UserRole),
    avatarUrl: zod_1.z.string().url().optional(),
    inviteSecret: zod_1.z.string().optional()
});
async function signupHandler(req, res) {
    try {
        const data = signupSchema.parse(req.body);
        if (data.role === enums_js_1.UserRole.ADMIN) {
            if (!data.inviteSecret || data.inviteSecret !== process.env.ADMIN_INVITE_SECRET) {
                return res.status(403).json({ message: 'Invalid admin invite secret' });
            }
        }
        const { inviteSecret, ...rest } = data;
        const out = await (0, auth_service_js_1.registerUser)(rest); // cast due to zod unknown -> any
        res.status(201).json({ message: 'User created. Verify OTP sent to email.', ...out });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
}
async function verifyOtpHandler(req, res) {
    const schema = zod_1.z.object({ userId: zod_1.z.string(), otp: zod_1.z.string().length(6) });
    try {
        const { userId, otp } = schema.parse(req.body);
        await (0, auth_service_js_1.verifyOtp)(userId, otp);
        res.json({ message: 'Verification successful' });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
}
async function loginHandler(req, res) {
    const schema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string() });
    try {
        const { email, password } = schema.parse(req.body);
        const tokens = await (0, auth_service_js_1.login)(email, password);
        res.json(tokens);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
}
async function refreshHandler(req, res) {
    const schema = zod_1.z.object({ refreshToken: zod_1.z.string() });
    try {
        const { refreshToken } = schema.parse(req.body);
        const tokens = await (0, auth_service_js_1.rotateRefreshToken)(refreshToken);
        res.json(tokens);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
}
async function logoutHandler(req, res) {
    const schema = zod_1.z.object({ refreshToken: zod_1.z.string() });
    try {
        const { refreshToken } = schema.parse(req.body);
        await (0, auth_service_js_1.logout)(refreshToken);
        res.json({ message: 'Logged out' });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
}
