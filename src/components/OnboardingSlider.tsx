import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { themeConfig } from '../theme.config';

export const OnboardingSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % themeConfig.onboarding.slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center ken-burns"
            style={{ backgroundImage: `url(${themeConfig.onboarding.slides[currentSlide].image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute inset-0 flex flex-col justify-end p-16 text-left pointer-events-none max-w-3xl z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${currentSlide}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="space-y-6"
          >
            <div className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">
              Inspiración del Chef
            </div>
            <h2 className="text-5xl md:text-6xl font-display italic leading-[1.1] text-white">
              "{themeConfig.onboarding.slides[currentSlide].title}"
            </h2>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
