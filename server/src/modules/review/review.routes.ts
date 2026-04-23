import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { ReviewController } from './review.controller.js';

const router = Router();

// Create a new review (authenticated users only, must have booked the facility)
router.post('/', requireAuth, ReviewController.createReview);

// Get reviews for a facility (public)
router.get('/facility/:facilityId', ReviewController.getFacilityReviews);

// Get facility rating statistics (public)
router.get('/facility/:facilityId/stats', ReviewController.getFacilityRatingStats);

// Get current user's reviews (authenticated users only)
router.get('/my', requireAuth, ReviewController.getMyReviews);

// Update a review (authenticated users only, must be the review author)
router.put('/:reviewId', requireAuth, ReviewController.updateReview);

// Delete a review (authenticated users only, must be the review author)
router.delete('/:reviewId', requireAuth, ReviewController.deleteReview);

export default router;
