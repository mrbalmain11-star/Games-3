import React from 'react';
import foodsSheet from '../assets/images/greedy_3d_foods_1793428206439.jpg';
import saladPizzaSheet from '../assets/images/greedy_salad_pizza_1793428228128.jpg';

interface Food3DProps {
  id: string;
  size?: number;
  className?: string;
}

export const Food3DAsset: React.FC<Food3DProps> = ({ id, size = 52, className = '' }) => {
  // Enhanced, tightly-centered zoom coordinates to make each food model look large, clear, and prominent
  const getStyle = (): React.CSSProperties => {
    switch (id) {
      case 'fish':
        return {
          backgroundImage: `url(${foodsSheet})`,
          backgroundPosition: '18% 17%',
          backgroundSize: '430%',
          backgroundRepeat: 'no-repeat',
        };
      case 'meat':
        return {
          backgroundImage: `url(${foodsSheet})`,
          backgroundPosition: '50% 17%',
          backgroundSize: '430%',
          backgroundRepeat: 'no-repeat',
        };
      case 'chicken':
        return {
          backgroundImage: `url(${foodsSheet})`,
          backgroundPosition: '82% 17%',
          backgroundSize: '430%',
          backgroundRepeat: 'no-repeat',
        };
      case 'shrimp':
        return {
          backgroundImage: `url(${foodsSheet})`,
          backgroundPosition: '18% 49%',
          backgroundSize: '440%',
          backgroundRepeat: 'no-repeat',
        };
      case 'tomato':
        return {
          backgroundImage: `url(${foodsSheet})`,
          backgroundPosition: '50% 49%',
          backgroundSize: '440%',
          backgroundRepeat: 'no-repeat',
        };
      case 'broccoli':
        return {
          backgroundImage: `url(${foodsSheet})`,
          backgroundPosition: '83% 49%',
          backgroundSize: '440%',
          backgroundRepeat: 'no-repeat',
        };
      case 'corn':
        return {
          backgroundImage: `url(${foodsSheet})`,
          backgroundPosition: '50% 82%',
          backgroundSize: '440%',
          backgroundRepeat: 'no-repeat',
        };
      case 'carrot':
        return {
          backgroundImage: `url(${foodsSheet})`,
          backgroundPosition: '82% 82%',
          backgroundSize: '440%',
          backgroundRepeat: 'no-repeat',
        };
      case 'salad':
        return {
          backgroundImage: `url(${saladPizzaSheet})`,
          backgroundPosition: '24% 50%',
          backgroundSize: '240%',
          backgroundRepeat: 'no-repeat',
        };
      case 'pizza':
        return {
          backgroundImage: `url(${saladPizzaSheet})`,
          backgroundPosition: '76% 50%',
          backgroundSize: '240%',
          backgroundRepeat: 'no-repeat',
        };
      default:
        return {
          backgroundImage: `url(${foodsSheet})`,
          backgroundPosition: '50% 82%',
          backgroundSize: '440%',
          backgroundRepeat: 'no-repeat',
        };
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Soft inner radial illumination to make colors pop brightly */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
      <div
        className="relative rounded-xl overflow-hidden select-none filter contrast-110 brightness-105 drop-shadow-[0_5px_10px_rgba(0,0,0,0.55)] transition-transform"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          ...getStyle(),
        }}
      />
    </div>
  );
};
