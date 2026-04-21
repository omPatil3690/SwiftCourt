import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Maximize2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';

interface ImageCarouselProps {
  images: string[];
  videos?: string[];
  venueName: string;
}

const ImageCarousel = ({ images, videos = [], venueName }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState<{ [key: number]: boolean }>({});

  // Combine images and videos
  const allMedia = [
    ...images.map((url, index) => ({ type: 'image' as const, url, id: `img-${index}` })),
    ...videos.map((url, index) => ({ type: 'video' as const, url, id: `vid-${index}` }))
  ];

  const totalItems = allMedia.length;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleImageLoad = (index: number) => {
    setIsImageLoaded(prev => ({ ...prev, [index]: true }));
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  if (totalItems === 0) {
    return (
      <div className="relative h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🏟️</div>
          <p className="text-lg font-medium">{venueName}</p>
          <p className="text-sm opacity-90">No images available</p>
        </div>
      </div>
    );
  }

  const currentMedia = allMedia[currentIndex];

  return (
    <>
      <div className="relative group">
        {/* Main Carousel */}
        <div className="relative h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden bg-gray-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {currentMedia.type === 'image' ? (
                <>
                  {/* Loading placeholder */}
                  {!isImageLoaded[currentIndex] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <div className="text-white text-4xl">🏟️</div>
                    </div>
                  )}
                  <img
                    src={currentMedia.url}
                    alt={`${venueName} - Image ${currentIndex + 1}`}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      isImageLoaded[currentIndex] ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(currentIndex)}
                  />
                </>
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={currentMedia.url}
                    className="w-full h-full object-cover"
                    controls={false}
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-full p-3">
                      <Play className="h-8 w-8 text-gray-900" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {totalItems > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Fullscreen Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={openFullscreen}
            className="absolute top-4 right-4 h-10 w-10 p-0 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          {/* Slide Indicators */}
          {totalItems > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {allMedia.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    currentIndex === index
                      ? 'bg-green-400 scale-125'
                      : 'bg-white/60 hover:bg-green-200'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Media Type Badge */}
          {currentMedia.type === 'video' && (
            <div className="absolute top-4 left-4">
              <div className="bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <Play className="h-3 w-3" />
                Video
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {totalItems > 1 && (
          <div className="mt-4 hidden sm:block">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allMedia.slice(0, 6).map((media, index) => (
                <motion.button
                  key={media.id}
                  onClick={() => goToSlide(index)}
                  className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    currentIndex === index
                      ? 'border-green-500 scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  whileHover={{ scale: currentIndex !== index ? 1.05 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <Play className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                  
                  {currentIndex === index && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-20" />
                  )}
                </motion.button>
              ))}
              
              {totalItems > 6 && (
                <div className="flex-shrink-0 w-20 h-16 rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50">
                  <span className="text-xs text-gray-600 font-medium">
                    +{totalItems - 6}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-screen-xl h-screen p-0 bg-black">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 h-10 w-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>

            {totalItems > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 p-0 z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 p-0 z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="max-w-full max-h-full"
              >
                {currentMedia.type === 'image' ? (
                  <img
                    src={currentMedia.url}
                    alt={`${venueName} - Full size ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <video
                    src={currentMedia.url}
                    className="max-w-full max-h-full object-contain"
                    controls
                    autoPlay
                    muted
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Slide Counter */}
            {totalItems > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded text-sm">
                {currentIndex + 1} / {totalItems}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageCarousel;
