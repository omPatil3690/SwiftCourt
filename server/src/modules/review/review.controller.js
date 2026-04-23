"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const review_service_js_1 = require("./review.service.js");
class ReviewController {
    // POST /reviews - Create a new review
    static async createReview(req, res) {
        try {
            const { facilityId, rating, comment, sport } = req.body;
            const userId = req.user.id;
            // Validate required fields
            if (!facilityId || !rating) {
                return res.status(400).json({
                    error: 'Facility ID and rating are required'
                });
            }
            const review = await review_service_js_1.ReviewService.createReview({
                userId,
                facilityId,
                rating,
                comment,
                sport
            });
            res.status(201).json(review);
        }
        catch (error) {
            console.error('Create review error:', error);
            res.status(400).json({ error: error.message });
        }
    }
    // GET /reviews/facility/:facilityId - Get reviews for a facility
    static async getFacilityReviews(req, res) {
        try {
            const { facilityId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const result = await review_service_js_1.ReviewService.getFacilityReviews(facilityId, page, pageSize);
            res.json(result);
        }
        catch (error) {
            console.error('Get facility reviews error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    // GET /reviews/facility/:facilityId/stats - Get facility rating statistics
    static async getFacilityRatingStats(req, res) {
        try {
            const { facilityId } = req.params;
            const stats = await review_service_js_1.ReviewService.getFacilityRatingStats(facilityId);
            res.json(stats);
        }
        catch (error) {
            console.error('Get facility rating stats error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    // PUT /reviews/:reviewId - Update a review
    static async updateReview(req, res) {
        try {
            const { reviewId } = req.params;
            const { rating, comment, sport } = req.body;
            const userId = req.user.id;
            const review = await review_service_js_1.ReviewService.updateReview(reviewId, userId, {
                rating,
                comment,
                sport
            });
            res.json(review);
        }
        catch (error) {
            console.error('Update review error:', error);
            res.status(400).json({ error: error.message });
        }
    }
    // DELETE /reviews/:reviewId - Delete a review
    static async deleteReview(req, res) {
        try {
            const { reviewId } = req.params;
            const userId = req.user.id;
            const result = await review_service_js_1.ReviewService.deleteReview(reviewId, userId);
            res.json(result);
        }
        catch (error) {
            console.error('Delete review error:', error);
            res.status(400).json({ error: error.message });
        }
    }
    // GET /reviews/my - Get current user's reviews
    static async getMyReviews(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;
            const result = await review_service_js_1.ReviewService.getUserReviews(userId, page, pageSize);
            res.json(result);
        }
        catch (error) {
            console.error('Get user reviews error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
exports.ReviewController = ReviewController;
