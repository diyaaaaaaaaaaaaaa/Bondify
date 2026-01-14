import { motion } from 'framer-motion';
import { TrendingUp, Shield, Clock, CheckCircle } from 'lucide-react';
import { Bond } from '@/data/mockBonds';

interface TerminalBondCardProps {
  bond: Bond;
  onBuy: (bond: Bond) => void;
  isActive?: boolean;
}

export const TerminalBondCard = ({ bond, onBuy, isActive = true }: TerminalBondCardProps) => {
  const riskColors = {
    Low: 'text-primary',
    Medium: 'text-yellow-500',
    High: 'text-destructive',
  };

  return (
    <motion.div
      className="asset-card relative w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isActive ? 1 : 0.3, scale: isActive ? 1 : 0.95 }}
      transition={{ duration: 0.5 }}
    >
      {/* Terminal-style container with corner accents */}
      <div className="relative bg-card/80 backdrop-blur-sm border border-primary/30 p-8">
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

        {/* Outer glow effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 via-transparent to-primary/20 -z-10 blur-sm" />

        {/* Terminal header */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-primary/20">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-primary font-mono text-sm uppercase tracking-widest">
            Live Market Feed
          </span>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {/* Bond identifier */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-3xl font-bold uppercase tracking-tight font-mono">
                {bond.shortName}
              </h3>
              <p className="text-muted-foreground mt-1">{bond.name}</p>
            </div>
            <span className={`text-sm font-mono px-3 py-1 border ${riskColors[bond.riskLevel]} border-current`}>
              {bond.riskLevel} Risk
            </span>
          </div>

          {/* Terminal-style data rows */}
          <div className="font-mono text-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-primary">{'>'}</span>
              <span className="text-muted-foreground">APY:</span>
              <span className="text-primary text-xl font-bold">{bond.interestRate}%</span>
              <TrendingUp className="w-4 h-4 text-primary ml-1" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">{'>'}</span>
              <span className="text-muted-foreground">Maturity:</span>
              <span className="text-foreground">{bond.maturityPeriod}</span>
              <Clock className="w-4 h-4 text-muted-foreground ml-1" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">{'>'}</span>
              <span className="text-muted-foreground">Issuer:</span>
              <span className="text-foreground">{bond.issuer}</span>
              <Shield className="w-4 h-4 text-muted-foreground ml-1" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">{'>'}</span>
              <span className="text-muted-foreground">Min. Investment:</span>
              <span className="text-foreground font-bold">₹{bond.minInvestment}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">{'>'}</span>
              <span className="text-muted-foreground">Verification:</span>
              <span className="text-primary">COMPLETE</span>
              <CheckCircle className="w-4 h-4 text-primary ml-1" />
            </div>
          </div>

          {/* Availability bar */}
          <div className="pt-4 border-t border-primary/20">
            <div className="flex justify-between text-xs font-mono text-muted-foreground mb-2">
              <span>Availability</span>
              <span>{((bond.available / bond.totalSupply) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-muted/50 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/60"
                initial={{ width: 0 }}
                animate={{ width: `${(bond.available / bond.totalSupply) * 100}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>

          {/* Buy button */}
          <motion.button
            className="btn-buy w-full py-4 px-6 bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm border-0 relative overflow-hidden group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onBuy(bond)}
          >
            <span className="relative z-10">Buy {bond.shortName}</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
