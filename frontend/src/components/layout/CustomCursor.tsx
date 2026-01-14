import { useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface CursorLabel {
  text: string;
  color: string;
}

const cursorLabels: Record<string, CursorLabel> = {
  'btn-buy': { text: 'MINT ₹100', color: '#22C55E' },
  'btn-claim': { text: 'COLLECT USDC', color: '#9333EA' },
  'terminal-zone': { text: 'VERIFY PROOF', color: '#FFFFFF' },
  'asset-card': { text: 'VIEW DETAILS', color: '#22C55E' },
  'btn-connect': { text: 'CONNECT', color: '#22C55E' },
  'btn-redeem': { text: 'REDEEM', color: '#9333EA' },
};

export const CustomCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [label, setLabel] = useState<CursorLabel | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 700 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  const moveCursor = useCallback((e: MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
    if (!isVisible) setIsVisible(true);
  }, [cursorX, cursorY, isVisible]);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    for (const [className, labelData] of Object.entries(cursorLabels)) {
      if (target.closest(`.${className}`)) {
        setLabel(labelData);
        setIsHovering(true);
        return;
      }
    }
    
    setLabel(null);
    setIsHovering(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', moveCursor, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [moveCursor, handleMouseOver, handleMouseLeave]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Center dot - follows cursor directly */}
      <motion.div
        className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
        style={{
          left: cursorX,
          top: cursorY,
        }}
      >
        <div className="w-full h-full rounded-full bg-foreground" />
      </motion.div>

      {/* Spring-lagged ring */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: springX,
          top: springY,
        }}
      >
        <motion.div
          className="rounded-full border-2 border-foreground/50"
          animate={{
            width: isHovering ? 60 : 40,
            height: isHovering ? 60 : 40,
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* Context label - positioned below ring */}
      {label && (
        <motion.div
          className="absolute -translate-x-1/2"
          style={{
            left: springX,
            top: springY,
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 45 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <span
            className="text-xs font-bold uppercase tracking-wider whitespace-nowrap block"
            style={{ 
              color: label.color,
              textShadow: `0 0 10px ${label.color}`,
            }}
          >
            {label.text}
          </span>
        </motion.div>
      )}
    </div>
  );
};
