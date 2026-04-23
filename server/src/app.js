"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_js_1 = require("./config/env.js");
const auth_routes_js_1 = require("./modules/auth/auth.routes.js");
const facility_routes_js_1 = require("./modules/facility/facility.routes.js");
const court_routes_js_1 = require("./modules/court/court.routes.js");
const booking_routes_js_1 = require("./modules/booking/booking.routes.js");
const booking_extras_routes_js_1 = require("./modules/booking/booking.extras.routes.js");
const admin_routes_js_1 = require("./modules/admin/admin.routes.js");
const review_routes_js_1 = __importDefault(require("./modules/review/review.routes.js"));
const loyalty_routes_js_1 = require("./modules/loyalty/loyalty.routes.js");
const badge_routes_js_1 = require("./modules/badge/badge.routes.js");
const error_js_1 = require("./middleware/error.js");
const sentry_1 = require("./sentry");
exports.app = (0, express_1.default)();
// Initialize Sentry early
(0, sentry_1.initSentry)();
// Sentry request context
exports.app.use(sentry_1.sentryRequestHandler);
exports.app.use((0, helmet_1.default)());
// Enhanced CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (env_js_1.env.nodeEnv === 'development') {
            // Allow all localhost ports in development
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:8080',
                'http://localhost:8081',
                'http://localhost:8082',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:8080',
                'http://127.0.0.1:8081',
                'http://127.0.0.1:8082',
                'http://localhost:5173',
                'http://127.0.0.1:5173'
            ];
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                console.log('CORS blocked origin:', origin);
                callback(null, true); // Allow in development for debugging
            }
        }
        else {
            // Production CORS
            const allowedOrigins = Array.isArray(env_js_1.env.corsOrigin) ? env_js_1.env.corsOrigin : [env_js_1.env.corsOrigin];
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
exports.app.use((0, cors_1.default)(corsOptions));
exports.app.use(express_1.default.json({ limit: '50mb' })); // Increase JSON payload limit
exports.app.use(express_1.default.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded payload limit
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, morgan_1.default)('dev'));
// Serve uploaded files statically
exports.app.use('/uploads', express_1.default.static('uploads'));
exports.app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
exports.app.use('/auth', auth_routes_js_1.authRouter);
exports.app.use('/facilities', facility_routes_js_1.facilityRouter);
exports.app.use('/courts', court_routes_js_1.courtRouter);
exports.app.use('/bookings', booking_routes_js_1.bookingRouter);
exports.app.use('/bookings', booking_extras_routes_js_1.bookingExtrasRouter);
exports.app.use('/admin', admin_routes_js_1.adminRouter);
exports.app.use('/reviews', review_routes_js_1.default);
exports.app.use('/loyalty', loyalty_routes_js_1.loyaltyRouter);
exports.app.use('/badges', badge_routes_js_1.badgeRouter);
exports.app.use(error_js_1.notFound);
// Sentry error capture must come before our error handler
exports.app.use(sentry_1.sentryErrorHandler);
exports.app.use(error_js_1.errorHandler);
