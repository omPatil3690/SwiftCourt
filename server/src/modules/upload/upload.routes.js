"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../../middleware/auth.js");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadRouter = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `court-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});
// Upload single image
uploadRouter.post('/image', auth_js_1.requireAuth, upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        const imageUrl = `http://localhost:4000/uploads/${file.filename}`;
        res.json({
            message: 'Image uploaded successfully',
            imageUrl,
            filename: file.filename,
            size: file.size
        });
    }
    catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ message: 'Failed to upload image' });
    }
});
// Upload multiple images
uploadRouter.post('/images', auth_js_1.requireAuth, upload.array('images', 10), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No image files provided' });
        }
        const imageUrls = files.map(file => ({
            url: `http://localhost:4000/uploads/${file.filename}`,
            filename: file.filename,
            size: file.size,
            originalName: file.originalname
        }));
        res.json({
            message: `${files.length} image(s) uploaded successfully`,
            images: imageUrls
        });
    }
    catch (error) {
        console.error('Images upload error:', error);
        res.status(500).json({ message: 'Failed to upload images' });
    }
});
exports.default = uploadRouter;
