"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_js_1.env.accessTokenSecret, { expiresIn: env_js_1.env.accessTokenTtl });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_js_1.env.refreshTokenSecret, { expiresIn: env_js_1.env.refreshTokenTtl });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_js_1.env.accessTokenSecret);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_js_1.env.refreshTokenSecret);
}
