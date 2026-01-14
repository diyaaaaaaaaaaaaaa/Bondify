import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Wallet, Shield, TrendingUp, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollIndicator } from '@/components/layout/ScrollIndicator';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { useBondContext } from '@/context/BondContext';

export const Hero = () => {
  const { wallet } = useBondContext();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Faster shrink to 0% scale (fully hidden)
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.5], [0, 60]);

  const features = [
    { icon: Shield, label: 'Government Backed' },
    { icon: TrendingUp, label: 'Fixed Yields' },
    { icon: Coins, label: 'Start with ₹100' },
  ];

  return (
    <div ref={containerRef} className="h-[120vh] relative">
      <motion.section
        className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden"
        style={{ scale, opacity, borderRadius }}
      >
        {/* Background Paths Animation */}
        <BackgroundPaths />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 grid-pattern opacity-50" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium uppercase tracking-wider mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              EIBS 2.0 Hackathon Project
            </span>
          </motion.div>

          <motion.h1
            className="heading-brutal text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            FRACTIONAL
            <br />
            <span className="text-primary text-glow-green">GOVERNMENT BONDS</span>
            <br />
            ON BLOCKCHAIN
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Invest safely in government-backed bonds with as little as{' '}
            <span className="text-primary font-semibold">₹100</span> using
            stablecoins. Earn fixed yields. Build your future.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {wallet.isConnected ? (
              <Button size="lg" className="btn-buy glow-green px-8 py-6 text-lg font-semibold" asChild>
                <a href="#marketplace">
                  EXPLORE BONDS <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
            ) : (
              <Button size="lg" className="btn-connect glow-green px-8 py-6 text-lg font-semibold" onClick={wallet.connect}>
                <Wallet className="mr-2 w-5 h-5" />
                {wallet.isConnecting ? 'Connecting...' : 'CONNECT WALLET'}
              </Button>
            )}
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg text-primary border-primary/50 hover:bg-primary/10" asChild>
              <a href="#marketplace">LEARN MORE</a>
            </Button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <ScrollIndicator targetId="marketplace" />
      </motion.section>
    </div>
  );
};
