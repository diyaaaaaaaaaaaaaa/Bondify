import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { PurchaseModal } from '@/components/ui/PurchaseModal';
import { useBondify } from '@/hooks/useBondify';
import { ChevronDown, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// --- HYBRID INTERFACE ---
export interface Bond {
  // New UI Props
  id: string;
  ticker: string;
  type: string;
  apy: number;
  maturityYears: number;
  status: 'VERIFIED' | 'SOLD OUT';
  availability: number;
  priceChange24h: number;
  priceHistory: { time: string; value: number }[];
  issuer: string;
  risk: 'Low' | 'Medium' | 'High';

  // Legacy Props
  name: string;
  shortName: string;
  interestRate: number;
  maturityDate: string;
  maturityPeriod: string;
  minInvestment: number;
  price: number;
  availableTokens: number;
  totalSupply: number;
  description: string;
  available: boolean;
  riskLevel: string;
}

// --- SMOOTH REALISTIC GRAPH GENERATOR ---
const generateSmoothHistory = (baseYield: number, volatility: number, trend: 'up' | 'down' | 'flat' = 'flat') => {
  const points = 24;
  return Array.from({ length: points }, (_, i) => {
    // Create a smooth curve using sine waves
    const timeFactor = i / points;
    const wave1 = Math.sin(timeFactor * Math.PI * 2) * (volatility * 0.3); // Gentle wave
    const wave2 = Math.sin(timeFactor * Math.PI * 4) * (volatility * 0.1); // Micro fluctuations
    
    // Add trend drift
    let trendDrift = 0;
    if (trend === 'up') trendDrift = (i / points) * (volatility * 0.8);
    if (trend === 'down') trendDrift = -(i / points) * (volatility * 0.8);

    // Combine for final value
    const value = baseYield + wave1 + wave2 + trendDrift;
    
    return {
      time: `${i}:00`,
      value: Number(value.toFixed(4)), // Keep precision
    };
  });
};

const REAL_BONDS: Bond[] = [
  // 1. NABARD (Corporate/Infra) - Medium Volatility, Upward Trend
  {
    id: 'nabard-2030',
    ticker: 'INFRA 2030',
    type: 'Corporate (AAA)',
    apy: 7.80,
    maturityYears: 6,
    status: 'VERIFIED',
    availability: 70,
    priceChange24h: 0.43,
    priceHistory: generateSmoothHistory(7.80, 0.12, 'up'),
    issuer: 'NABARD',
    risk: 'Medium',
    name: 'Infrastructure Development Bond',
    shortName: 'INFRA 2030',
    interestRate: 7.80,
    maturityDate: '2030-10-15',
    maturityPeriod: '6 Years',
    minInvestment: 250,
    price: 100,
    availableTokens: 7000,
    totalSupply: 10000,
    description: 'High-yield infrastructure bond backed by NABARD.',
    available: true,
    riskLevel: 'Medium'
  },
  // 2. GOI 2033 (Sovereign) - Low Volatility, Flat Trend
  {
    id: 'goi-2033',
    ticker: 'GOI 2033',
    type: 'Sovereign',
    apy: 7.26,
    maturityYears: 9,
    status: 'VERIFIED',
    availability: 85,
    priceChange24h: 0.12,
    priceHistory: generateSmoothHistory(7.26, 0.04, 'flat'),
    issuer: 'GOI',
    risk: 'Low',
    name: '7.26% GS 2033',
    shortName: 'GOI 2033',
    interestRate: 7.26,
    maturityDate: '2033-01-01',
    maturityPeriod: '9 Years',
    minInvestment: 100,
    price: 100,
    availableTokens: 8500,
    totalSupply: 10000,
    description: 'Sovereign guarantee bond issued by the Government of India.',
    available: true,
    riskLevel: 'Low'
  },
  // 3. IRFC (PSU) - Low Volatility, Slight Dip
  {
    id: 'irfc-2028',
    ticker: 'RAIL 2028',
    type: 'PSU Bond',
    apy: 7.45,
    maturityYears: 4,
    status: 'VERIFIED',
    availability: 45,
    priceChange24h: -0.05,
    priceHistory: generateSmoothHistory(7.45, 0.06, 'down'),
    issuer: 'IRFC',
    risk: 'Low',
    name: 'Indian Railway Finance Corp',
    shortName: 'RAIL 2028',
    interestRate: 7.45,
    maturityDate: '2028-04-15',
    maturityPeriod: '4 Years',
    minInvestment: 500,
    price: 100,
    availableTokens: 4500,
    totalSupply: 10000,
    description: 'Tax-free PSU bond financing railway infrastructure.',
    available: true,
    riskLevel: 'Low'
  },
  // 4. REC Green Bond (Sustainable) - Medium Volatility, Upward
  {
    id: 'rec-green-27',
    ticker: 'GREEN 2027',
    type: 'Green Bond',
    apy: 7.15,
    maturityYears: 3,
    status: 'VERIFIED',
    availability: 90,
    priceChange24h: 0.22,
    priceHistory: generateSmoothHistory(7.15, 0.09, 'up'),
    issuer: 'REC Ltd',
    risk: 'Low',
    name: 'Rural Electrification Corp Green Bond',
    shortName: 'GREEN 2027',
    interestRate: 7.15,
    maturityDate: '2027-06-30',
    maturityPeriod: '3 Years',
    minInvestment: 1000,
    price: 100,
    availableTokens: 9000,
    totalSupply: 10000,
    description: 'Invest in renewable energy projects across rural India.',
    available: true,
    riskLevel: 'Low'
  },
  // 5. NHAI (High Safety) - Very Low Volatility, Flat
  {
    id: 'nhai-2030',
    ticker: 'NHAI 54EC',
    type: 'Cap Gains',
    apy: 5.25,
    maturityYears: 5,
    status: 'VERIFIED',
    availability: 12,
    priceChange24h: 0.01,
    priceHistory: generateSmoothHistory(5.25, 0.02, 'flat'),
    issuer: 'NHAI',
    risk: 'Low',
    name: 'National Highways Authority 54EC',
    shortName: 'NHAI 54EC',
    interestRate: 5.25,
    maturityDate: '2030-01-01',
    maturityPeriod: '5 Years',
    minInvestment: 10000,
    price: 100,
    availableTokens: 1200,
    totalSupply: 10000,
    description: 'Capital gains tax exemption bond. Ultra-low risk.',
    available: true,
    riskLevel: 'Low'
  },
  // 6. Maharashtra SDL (State Gov) - Medium Volatility, Slight Up
  {
    id: 'mh-sdl-32',
    ticker: 'MH SDL 32',
    type: 'State Gov',
    apy: 7.64,
    maturityYears: 8,
    status: 'VERIFIED',
    availability: 60,
    priceChange24h: 0.18,
    priceHistory: generateSmoothHistory(7.64, 0.08, 'up'),
    issuer: 'Maharashtra',
    risk: 'Low',
    name: 'Maharashtra State Development Loan',
    shortName: 'MH SDL 32',
    interestRate: 7.64,
    maturityDate: '2032-09-12',
    maturityPeriod: '8 Years',
    minInvestment: 500,
    price: 100,
    availableTokens: 6000,
    totalSupply: 10000,
    description: 'Sovereign-grade bond issued by the State of Maharashtra.',
    available: true,
    riskLevel: 'Low'
  },
  // 7. 7.18% GS 2037 (Long Term) - High Volatility, Downward
  {
    id: 'goi-2037',
    ticker: 'GOI 2037',
    type: 'Sovereign',
    apy: 7.18,
    maturityYears: 13,
    status: 'SOLD OUT',
    availability: 0,
    priceChange24h: -0.15,
    priceHistory: generateSmoothHistory(7.18, 0.10, 'down'),
    issuer: 'GOI',
    risk: 'Low',
    name: '7.18% GS 2037',
    shortName: 'GOI 2037',
    interestRate: 7.18,
    maturityDate: '2037-08-14',
    maturityPeriod: '13 Years',
    minInvestment: 100,
    price: 100,
    availableTokens: 0,
    totalSupply: 10000,
    description: 'Long-term government security for pension planning.',
    available: false,
    riskLevel: 'Low'
  }
];

export const BondMarketplace = () => {
  const { isConnected } = useBondify(); 
  const [selectedBond, setSelectedBond] = useState<Bond | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const bondCount = REAL_BONDS.length;

  return (
    <section id="marketplace" ref={containerRef} style={{ height: `${100 + bondCount * 80}vh` }}>
      <div className="sticky top-0 h-screen flex flex-col bg-background">
        <div className="pt-20 px-6 mb-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs text-primary uppercase tracking-widest font-mono">
                {'>'} Invest Now
              </span>
              <h2 className="heading-brutal text-4xl md:text-5xl mt-2 font-bold">BOND MARKETPLACE</h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Browse and invest in tokenized government securities. All bonds are backed by real-world assets.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="flex-1 relative w-full max-w-5xl mx-auto px-6">
          {REAL_BONDS.map((bond, index) => (
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

        <div className="pb-6 flex flex-col items-center gap-2 z-10">
          <div className="flex gap-2">
             {REAL_BONDS.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-primary/20'}`} />
             ))}
          </div>
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

      {/* @ts-ignore - Types are compatible via interface intersection */}
      <PurchaseModal 
        bond={selectedBond} 
        isOpen={!!selectedBond} 
        onClose={() => setSelectedBond(null)} 
      />
    </section>
  );
};

// --- Sub Components ---
interface BondSlideProps {
  bond: Bond;
  index: number;
  totalBonds: number;
  scrollYProgress: any;
  onBuy: (bond: Bond) => void;
}

const BondSlide = ({ bond, index, totalBonds, scrollYProgress, onBuy }: BondSlideProps) => {
  const segmentSize = 1 / totalBonds;
  const start = index * segmentSize;
  const end = (index + 1) * segmentSize;

  const opacity = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [50, 0, 0, -50]);
  const scale = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0.9, 1, 1, 0.9]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, y, scale }}
    >
      <div className="pointer-events-auto w-full">
         <DetailedBondCard bond={bond} onBuy={() => onBuy(bond)} />
      </div>
    </motion.div>
  );
};

const DetailedBondCard = ({ bond, onBuy }: { bond: Bond; onBuy: () => void }) => {
  const isPositive = bond.priceChange24h >= 0;

  return (
    <div className="relative bg-[#0A0A0A] border border-white/10 rounded-lg p-6 max-w-3xl mx-auto shadow-2xl overflow-hidden group">
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50" />

      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(198,255,0,0.5)]" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
          Live Market Feed
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div>
            <h3 className="text-3xl font-bold text-white tracking-tight font-mono">{bond.ticker}</h3>
            <p className="text-muted-foreground text-sm mt-1">{bond.name}</p>
            <div className={`inline-flex items-center gap-1.5 mt-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
              bond.risk === 'Low' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 
              bond.risk === 'Medium' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
              'border-red-500/30 text-red-400 bg-red-500/10'
            }`}>
              {bond.risk === 'Low' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {bond.risk} Risk
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm font-mono">
            <div>
              <span className="text-muted-foreground block text-xs mb-1">{'>'} APY</span>
              <span className="text-primary font-bold text-lg">{bond.apy.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">{'>'} Maturity</span>
              <span className="text-white">{bond.maturityYears} Years</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">{'>'} Issuer</span>
              <span className="text-white">{bond.issuer}</span>
            </div>
             <div>
              <span className="text-muted-foreground block text-xs mb-1">{'>'} Min Inv</span>
              <span className="text-white">₹{bond.minInvestment}</span>
            </div>
             <div>
              <span className="text-muted-foreground block text-xs mb-1">{'>'} Status</span>
              <span className="text-green-400">{bond.status}</span>
            </div>
             <div>
              <span className="text-muted-foreground block text-xs mb-1">{'>'} Avail</span>
              <span className="text-white">{bond.availability}%</span>
            </div>
          </div>

          <button 
            onClick={onBuy}
            className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 px-4 rounded transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider text-sm"
          >
            Buy Now
          </button>
        </div>

        <div className="w-full md:w-64 bg-white/5 rounded-lg border border-white/5 p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">24H Yield</span>
            <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${!isPositive && 'rotate-180'}`} />
              {isPositive ? '+' : ''}{bond.priceChange24h.toFixed(2)}%
            </div>
          </div>
          
          <div className="text-2xl font-bold text-white mb-2">{bond.apy.toFixed(2)}%</div>

          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bond.priceHistory}>
                <Line 
                  type="monotone" // This creates the smooth curve
                  dataKey="value" 
                  stroke={isPositive ? "#C6FF00" : "#EF4444"} 
                  strokeWidth={2} 
                  dot={false} 
                />
                <YAxis domain={['dataMin', 'dataMax']} hide />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className={`h-8 w-full mt-[-32px] bg-gradient-to-t ${isPositive ? 'from-green-500/10' : 'from-red-500/10'} to-transparent`} />
        </div>

      </div>
    </div>
  );
};