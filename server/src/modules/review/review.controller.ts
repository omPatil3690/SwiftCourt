import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { ReviewService } from './review.service.js';

export class ReviewController {
  // POST /reviews - Create a new review
  static async createReview(req: AuthRequest, res: Response) {
    try {
      const { facilityId, rating, comment, sport } = req.body;
      const userId = req.user!.id;

      // Validate required fields
      if (!facilityId || !rating) {
        return res.status(400).json({
          error: 'Facility ID and rating are required'
        });
      }

      const review = await ReviewService.createReview({
        userId,
        facilityId,
        rating,
        comment,
        sport
      });

      res.status(201).json(review);
    } catch (error: any) {
      console.error('Create review error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // GET /reviews/facility/:facilityId - Get reviews for a facility
  static async getFacilityReviews(req: AuthRequest, res: Response) {
    try {
      const { facilityId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await ReviewService.getFacilityReviews(facilityId, page, pageSize);
      
      res.json(result);
    } catch (error: any) {
      console.error('Get facility reviews error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /reviews/facility/:facilityId/stats - Get facility rating statistics
  static async getFacilityRatingStats(req: AuthRequest, res: Response) {
    try {
      const { facilityId } = req.params;

      const stats = await ReviewService.getFacilityRatingStats(facilityId);
      
      res.json(stats);
    } catch (error: any) {
      console.error('Get facility rating stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // PUT /reviews/:reviewId - Update a review
  static async updateReview(req: AuthRequest, res: Response) {
    try {
      const { reviewId } = req.params;
      const { rating, comment, sport } = req.body;
      const userId = req.user!.id;

      const review = await ReviewService.updateReview(reviewId, userId, {
        rating,
        comment,
        sport
      });

      res.json(review);
    } catch (error: any) {
      console.error('Update review error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // DELETE /reviews/:reviewId - Delete a review
  static async deleteReview(req: AuthRequest, res: Response) {
    try {
      const { reviewId } = req.params;
      const userId = req.user!.id;

      const result = await ReviewService.deleteReview(reviewId, userId);

      res.json(result);
    } catch (error: any) {
      console.error('Delete review error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // GET /reviews/my - Get current user's reviews
  static async getMyReviews(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await ReviewService.getUserReviews(userId, page, pageSize);
      
      res.json(result);
    } catch (error: any) {
      console.error('Get user reviews error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
