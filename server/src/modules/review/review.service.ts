import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateReviewData {
  userId: string;
  facilityId: string;
  rating: number;
  comment?: string;
  sport?: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  sport?: string;
}

export class ReviewService {
  // Create a new review (only if user has booked the facility)
  static async createReview(data: CreateReviewData) {
    // First check if user has actually booked this facility
    const hasBooking = await prisma.booking.findFirst({
      where: {
        userId: data.userId,
        court: {
          facilityId: data.facilityId
        },
        status: 'COMPLETED' // Only completed bookings can leave reviews
      }
    });

    if (!hasBooking) {
      throw new Error('You can only review facilities you have booked and completed');
    }

    // Check if user already has a review for this facility
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_facilityId: {
          userId: data.userId,
          facilityId: data.facilityId
        }
      }
    });

    if (existingReview) {
      throw new Error('You have already reviewed this facility');
    }

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        ...data,
        isVerified: true // Mark as verified since user has completed booking
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });

    return review;
  }

  // Get reviews for a facility
  static async getFacilityReviews(facilityId: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { facilityId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.review.count({ where: { facilityId } })
    ]);

    return {
      reviews,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  }

  // Get facility rating statistics
  static async getFacilityRatingStats(facilityId: string) {
    const stats = await prisma.review.aggregate({
      where: { facilityId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { facilityId },
      _count: { rating: true },
      orderBy: { rating: 'desc' }
    });

    return {
      averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0,
      totalReviews: stats._count.rating,
      ratingDistribution: ratingDistribution.map(r => ({
        rating: r.rating,
        count: r._count.rating
      }))
    };
  }

  // Update a review
  static async updateReview(reviewId: string, userId: string, data: UpdateReviewData) {
    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId
      }
    });

    if (!existingReview) {
      throw new Error('Review not found or you do not have permission to update it');
    }

    // Validate rating if provided
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });

    return updatedReview;
  }

  // Delete a review
  static async deleteReview(reviewId: string, userId: string) {
    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId
      }
    });

    if (!existingReview) {
      throw new Error('Review not found or you do not have permission to delete it');
    }

    await prisma.review.delete({
      where: { id: reviewId }
    });

    return { message: 'Review deleted successfully' };
  }

  // Get user's reviews
  static async getUserReviews(userId: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              location: true,
              images: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.review.count({ where: { userId } })
    ]);

    return {
      reviews,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  }
}
