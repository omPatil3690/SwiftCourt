"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_js_1 = require("../config/env.js");
let transporter = null;
function ensureTransport() {
    if (transporter)
        return transporter;
    if (!env_js_1.env.smtpHost || !env_js_1.env.smtpPort || !env_js_1.env.smtpUser || !env_js_1.env.smtpPass) {
        return null; // email disabled
    }
    transporter = nodemailer_1.default.createTransport({
        host: env_js_1.env.smtpHost,
        port: env_js_1.env.smtpPort,
        secure: env_js_1.env.smtpPort === 465,
        auth: { user: env_js_1.env.smtpUser, pass: env_js_1.env.smtpPass }
    });
    return transporter;
}
async function sendEmail(to, subject, html) {
    const tx = ensureTransport();
    if (!tx) {
        console.log('[email disabled]', subject, '->', to);
        return { queued: false, disabled: true };
    }
    const info = await tx.sendMail({ from: env_js_1.env.emailFrom, to, subject, html });
    console.log('[email sent]', info.messageId, 'to', to);
    return { queued: true, id: info.messageId };
}
