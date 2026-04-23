"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const app_1 = require("../src/app");
function handler(req, res) {
    (0, app_1.app)(req, res);
}
