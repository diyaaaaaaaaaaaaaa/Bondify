import { motion } from 'framer-motion';
import { TrendingUp, Shield, Clock } from 'lucide-react';
import { Bond } from '@/data/mockBonds';

interface BondCardProps {
  bond: Bond;
  index: number;
  onBuy: (bond: Bond) => void;
}

export const BondCard = ({ bond, index, onBuy }: BondCardProps) => {
  const riskColors = {
    Low: 'text-primary',
    Medium: 'text-yellow-500',
    High: 'text-destructive',
  };

  return (
    <motion.div
      className="asset-card group relative bg-card border border-border rounded-2xl p-6 overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        borderColor: 'hsl(var(--primary) / 0.5)',
        boxShadow: '0 0 30px hsl(var(--neon-green) / 0.15), inset 0 0 30px hsl(var(--neon-green) / 0.03)',
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold uppercase tracking-tight">{bond.shortName}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{bond.name}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full bg-muted ${riskColors[bond.riskLevel]}`}>
            {bond.riskLevel} Risk
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">APY</p>
              <p className="text-xl font-bold text-primary">{bond.interestRate}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Maturity</p>
              <p className="text-sm font-semibold">{bond.maturityPeriod}</p>
            </div>
          </div>
        </div>

        {/* Min Investment & Issuer */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{bond.issuer}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Min. Investment</p>
            <p className="text-sm font-mono font-semibold">₹{bond.minInvestment}</p>
          </div>
        </div>

        {/* Progress bar for availability */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Available</span>
            <span>{((bond.available / bond.totalSupply) * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              whileInView={{ width: `${(bond.available / bond.totalSupply) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
            />
          </div>
        </div>

        {/* Buy Button */}
        <motion.button
          className="btn-buy w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onBuy(bond)}
        >
          Buy {bond.shortName}
        </motion.button>
      </div>
    </motion.div>
  );
};
