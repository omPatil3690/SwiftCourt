"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.errorHandler = errorHandler;
function notFound(_req, res) {
    res.status(404).json({ message: 'Not Found' });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, _req, res, _next) {
    console.error(err); // TODO: structured logger
    if (res.headersSent)
        return;
    res.status(err.status || 500).json({ message: err.message || 'Server Error' });
}
