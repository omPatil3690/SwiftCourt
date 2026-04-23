"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sentry = exports.sentryErrorHandler = exports.sentryRequestHandler = void 0;
exports.initSentry = initSentry;
const SentryNode = __importStar(require("@sentry/node"));
exports.Sentry = SentryNode;
const env_js_1 = require("./config/env.js");
// Initialize Sentry (no-op if DSN not set)
function initSentry() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn)
        return;
    SentryNode.init({
        dsn,
        environment: env_js_1.env.nodeEnv,
        tracesSampleRate: 0.1,
    });
}
const sentryRequestHandler = (req, _res, next) => {
    // establish minimal context in breadcrumb
    if (!process.env.SENTRY_DSN)
        return next();
    SentryNode.addBreadcrumb({
        category: 'http',
        message: `${req.method} ${req.originalUrl}`,
        level: 'info',
    });
    return next();
};
exports.sentryRequestHandler = sentryRequestHandler;
const sentryErrorHandler = (err, _req, _res, next) => {
    if (!process.env.SENTRY_DSN)
        return next(err);
    SentryNode.captureException(err);
    return next(err);
};
exports.sentryErrorHandler = sentryErrorHandler;
