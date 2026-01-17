import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { Bond } from '@/data/mockBonds';
import { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface TerminalBondCardProps {
  bond: Bond;
  onBuy: (bond: Bond) => void;
  isActive?: boolean;
}

// Generate realistic yield curve data based on bond properties
const generateYieldHistory = (bond: Bond) => {
  const points = 24; // 24 hours
  const baseRate = bond.interestRate;
  const volatility = bond.riskLevel === 'High' ? 0.15 : bond.riskLevel === 'Medium' ? 0.08 : 0.03;
  
  // Use bond id as seed for consistent random
  const seed = bond.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i * 9999) * 10000;
    return x - Math.floor(x);
  };
  
  let currentRate = baseRate * (1 - volatility / 2);
  const data = [];
  
  for (let i = 0; i < points; i++) {
    const change = (seededRandom(i) - 0.5) * volatility * baseRate;
    currentRate = Math.max(baseRate * 0.9, Math.min(baseRate * 1.1, currentRate + change));
    data.push({ hour: i, rate: currentRate });
  }
  
  // Ensure last point is close to current rate
  data[points - 1].rate = baseRate;
  
  return data;
};

export const TerminalBondCard = ({ bond, onBuy, isActive = true }: TerminalBondCardProps) => {
  const riskColors = {
    Low: 'text-primary',
    Medium: 'text-yellow-500',
    High: 'text-destructive',
  };

  const yieldHistory = useMemo(() => generateYieldHistory(bond), [bond]);
  
  const firstRate = yieldHistory[0]?.rate || bond.interestRate;
  const lastRate = yieldHistory[yieldHistory.length - 1]?.rate || bond.interestRate;
  const rateChange = lastRate - firstRate;
  const percentChange = ((rateChange / firstRate) * 100).toFixed(2);
  const isPositive = rateChange >= 0;

  return (
    <motion.div
      className="asset-card relative w-full max-w-5xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isActive ? 1 : 0.3, scale: isActive ? 1 : 0.95 }}
      transition={{ duration: 0.5 }}
    >
      {/* Terminal-style container with corner accents */}
      <div className="relative bg-card/80 backdrop-blur-sm border border-primary/30 p-6">
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

        {/* Outer glow effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 via-transparent to-primary/20 -z-10 blur-sm" />

        {/* Terminal header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-primary/20">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-primary font-mono text-sm uppercase tracking-widest">
            Live Market Feed
          </span>
        </div>

        {/* Main content - two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Bond info and stats */}
          <div className="space-y-4">
            {/* Bond identifier */}
            <div>
              <h3 className="text-3xl font-bold uppercase tracking-tight font-mono">
                {bond.shortName}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">{bond.name}</p>
              <span className={`inline-block text-xs font-mono px-2 py-0.5 border ${riskColors[bond.riskLevel]} border-current mt-2`}>
                {bond.riskLevel} Risk
              </span>
            </div>

            {/* Terminal-style data rows */}
            <div className="font-mono text-sm grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">APY:</span>
                <span className="text-primary font-bold">{bond.interestRate}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">Maturity:</span>
                <span className="text-foreground">{bond.maturityPeriod}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">Issuer:</span>
                <span className="text-foreground text-xs">{bond.issuer}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">Min:</span>
                <span className="text-foreground font-bold">₹{bond.minInvestment}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">Status:</span>
                <span className="text-primary">VERIFIED</span>
                <CheckCircle className="w-3 h-3 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">Avail:</span>
                <span className="text-foreground">{((bond.available / bond.totalSupply) * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Buy button */}
            <motion.button
              className="btn-buy w-full py-3 px-8 bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm border-0 relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onBuy(bond)}
            >
              <span className="relative z-10">Buy Now</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
          </div>

          {/* Right column: Chart */}
          <div className={`rounded-lg p-4 ${isPositive ? 'bg-primary/10' : 'bg-destructive/10'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground font-mono text-xs uppercase">24h Yield</span>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-primary" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <span className={`font-mono text-sm font-bold ${isPositive ? 'text-primary' : 'text-destructive'}`}>
                  {isPositive ? '+' : ''}{percentChange}%
                </span>
              </div>
            </div>
            
            <div className="text-2xl font-bold font-mono mb-2">
              {bond.interestRate}%
            </div>
            
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yieldHistory}>
                  <defs>
                    <linearGradient id={`gradient-${bond.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="0%" 
                        stopColor={isPositive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} 
                        stopOpacity={0.4} 
                      />
                      <stop 
                        offset="100%" 
                        stopColor={isPositive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} 
                        stopOpacity={0} 
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke={isPositive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                    strokeWidth={2}
                    fill={`url(#gradient-${bond.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
