import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TerminalBondCard } from '@/components/ui/TerminalBondCard';
import { PurchaseModal } from '@/components/ui/PurchaseModal';
import { useBondContext } from '@/context/BondContext';
import { Bond } from '@/data/mockBonds';
import { ChevronDown } from 'lucide-react';

export const BondMarketplace = () => {
  const { bonds } = useBondContext();
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Calculate which bond to show based on scroll position
  const bondCount = bonds.length;

  return (
    <section id="marketplace" ref={containerRef} style={{ height: `${100 + bondCount * 100}vh` }}>
      <div className="sticky top-0 h-screen flex flex-col">
        {/* Header */}
        <div className="pt-24 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs text-primary uppercase tracking-widest font-mono">
                {'>'} Invest Now
              </span>
              <h2 className="heading-brutal text-4xl md:text-5xl mt-2">Bond Marketplace</h2>
              <p className="text-muted-foreground mt-4 max-w-xl">
                Browse and invest in tokenized government securities. All bonds are backed by real-world assets.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Bond cards - one at a time */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          {bonds.map((bond, index) => (
            <BondSlide
              key={bond.id}
              bond={bond}
              index={index}
              totalBonds={bondCount}
              scrollYProgress={scrollYProgress}
              onBuy={setSelectedBond}
            />
          ))}
        </div>

        {/* Scroll indicator with bond counter */}
        <div className="pb-8 flex flex-col items-center gap-2">
          <BondCounter scrollYProgress={scrollYProgress} totalBonds={bondCount} />
          <motion.div
            className="flex items-center gap-2 text-muted-foreground text-sm"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span>Scroll for more</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </div>

      <PurchaseModal bond={selectedBond} isOpen={!!selectedBond} onClose={() => setSelectedBond(null)} />
    </section>
  );
};

interface BondSlideProps {
  bond: Bond;
  index: number;
  totalBonds: number;
  scrollYProgress: any;
  onBuy: (bond: Bond) => void;
}

const BondSlide = ({ bond, index, totalBonds, scrollYProgress, onBuy }: BondSlideProps) => {
  // Each bond takes 1/(totalBonds) of the scroll
  const segmentSize = 1 / totalBonds;
  const start = index * segmentSize;
  const end = (index + 1) * segmentSize;

  const opacity = useTransform(scrollYProgress, [
    Math.max(0, start - 0.05),
    start + 0.02,
    end - 0.02,
    Math.min(1, end + 0.05),
  ], [0, 1, 1, 0]);

  const y = useTransform(scrollYProgress, [
    start,
    start + 0.05,
    end - 0.05,
    end,
  ], [60, 0, 0, -60]);

  const scale = useTransform(scrollYProgress, [
    start,
    start + 0.05,
    end - 0.05,
    end,
  ], [0.9, 1, 1, 0.9]);

  return (
    <motion.div
      className="absolute w-full max-w-2xl px-6"
      style={{ opacity, y, scale }}
    >
      <TerminalBondCard bond={bond} onBuy={onBuy} />
    </motion.div>
  );
};

interface BondCounterProps {
  scrollYProgress: any;
  totalBonds: number;
}

const BondCounter = ({ scrollYProgress, totalBonds }: BondCounterProps) => {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalBonds }).map((_, index) => {
        const segmentSize = 1 / totalBonds;
        const start = index * segmentSize;
        const end = (index + 1) * segmentSize;

        return (
          <BondDot key={index} scrollYProgress={scrollYProgress} start={start} end={end} />
        );
      })}
    </div>
  );
};

interface BondDotProps {
  scrollYProgress: any;
  start: number;
  end: number;
}

const BondDot = ({ scrollYProgress, start, end }: BondDotProps) => {
  const isActive = useTransform(scrollYProgress, (v: number) => v >= start && v < end);
  const scale = useTransform(isActive, (active: boolean) => active ? 1.5 : 1);
  const bgOpacity = useTransform(isActive, (active: boolean) => active ? 1 : 0.3);

  return (
    <motion.div
      className="w-2 h-2 rounded-full bg-primary"
      style={{ scale, opacity: bgOpacity }}
      transition={{ duration: 0.2 }}
    />
  );
};
