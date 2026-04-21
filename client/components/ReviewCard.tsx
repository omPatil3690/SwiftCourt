import React from 'react';
import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  sport: string;
}

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getSportColor = (sport: string) => {
    // Use consistent green theme for all sports
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
    >
      <Card className="transition-shadow duration-200 hover:shadow-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.userAvatar} alt={review.userName} />
                <AvatarFallback className="bg-green-100 text-green-800 font-medium">
                  {getInitials(review.userName)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h4 className="font-medium text-gray-900">{review.userName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{formatDate(review.date)}</span>
                </div>
              </div>
            </div>
            
            <Badge variant="secondary" className={getSportColor(review.sport)}>
              {review.sport}
            </Badge>
          </div>

          {/* Review Content */}
          <div className="space-y-3">
            {/* Rating Display */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {renderStars(review.rating)}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {review.rating}.0 out of 5
              </span>
            </div>

            {/* Comment */}
            <p className="text-gray-700 leading-relaxed">
              {review.comment}
            </p>

            {/* Additional Info */}
            <div className="flex items-center gap-4 pt-2 text-sm text-gray-500 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Verified Player</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span>Played {review.sport}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReviewCard;
