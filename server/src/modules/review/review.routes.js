"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../../middleware/auth.js");
const review_controller_js_1 = require("./review.controller.js");
const router = (0, express_1.Router)();
// Create a new review (authenticated users only, must have booked the facility)
router.post('/', auth_js_1.requireAuth, review_controller_js_1.ReviewController.createReview);
// Get reviews for a facility (public)
router.get('/facility/:facilityId', review_controller_js_1.ReviewController.getFacilityReviews);
// Get facility rating statistics (public)
router.get('/facility/:facilityId/stats', review_controller_js_1.ReviewController.getFacilityRatingStats);
// Get current user's reviews (authenticated users only)
router.get('/my', auth_js_1.requireAuth, review_controller_js_1.ReviewController.getMyReviews);
// Update a review (authenticated users only, must be the review author)
router.put('/:reviewId', auth_js_1.requireAuth, review_controller_js_1.ReviewController.updateReview);
// Delete a review (authenticated users only, must be the review author)
router.delete('/:reviewId', auth_js_1.requireAuth, review_controller_js_1.ReviewController.deleteReview);
exports.default = router;
