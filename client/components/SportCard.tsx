import React from 'react';
import { motion } from 'framer-motion';

interface Sport {
  id: string;
  name: string;
  icon: string;
  venueCount: number;
  image: string;
}

interface SportCardProps {
  sport: Sport;
  onClick: () => void;
}

const SportCard: React.FC<SportCardProps> = ({ sport, onClick }) => {
  return (
    <motion.div
      className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Hover Effect Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 text-center">
        {/* Sport Icon/Emoji */}
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
          {sport.icon}
        </div>
        
        {/* Sport Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">
          {sport.name}
        </h3>
        
        {/* Venue Count */}
        <p className="text-sm text-gray-500">
          {sport.venueCount} venues
        </p>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-2 right-2 w-3 h-3 bg-green-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute bottom-2 left-2 w-2 h-2 bg-green-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </motion.div>
  );
};

export default SportCard;
