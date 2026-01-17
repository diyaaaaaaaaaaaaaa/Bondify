import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { PurchaseModal } from '@/components/ui/PurchaseModal';
import { useBondify } from '@/hooks/useBondify';
import { ChevronDown, ChevronLeft, ChevronRight, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
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

  // Legacy Props (Required for Modal compatibility)
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
    const timeFactor = i / points;
    const wave1 = Math.sin(timeFactor * Math.PI * 2) * (volatility * 0.3); 
    const wave2 = Math.sin(timeFactor * Math.PI * 4) * (volatility * 0.1); 
    
    let trendDrift = 0;
    if (trend === 'up') trendDrift = (i / points) * (volatility * 0.8);
    if (trend === 'down') trendDrift = -(i / points) * (volatility * 0.8);

    const value = baseYield + wave1 + wave2 + trendDrift;
    
    return {
      time: `${i}:00`,
      value: Number(value.toFixed(4)),
    };
  });
};

const REAL_BONDS: Bond[] = [
  // 1. NABARD
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
  // 2. GOI 2033
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
  // 3. IRFC
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
  // 4. REC Green Bond
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
  // 5. NHAI
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
  // 6. Maharashtra SDL
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
  // 7. GOI 2037 (Sold Out)
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
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? REAL_BONDS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === REAL_BONDS.length - 1 ? 0 : prev + 1));
  };

  const currentBond = REAL_BONDS[currentIndex];

  return (
    <section id="marketplace" className="min-h-screen py-24 px-6 bg-background scroll-snap-align-start">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="text-xs text-primary uppercase tracking-widest font-mono">
            {'>'} Invest Now
          </span>
          <h2 className="heading-brutal text-4xl md:text-5xl mt-2 font-bold">BOND MARKETPLACE</h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Browse and invest in tokenized government securities. All bonds are backed by real-world assets.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="flex flex-col gap-8">
          {/* Card Display */}
          <motion.div
            key={currentBond.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <DetailedBondCard bond={currentBond} onBuy={() => setSelectedBond(currentBond)} />
          </motion.div>

          {/* Navigation Controls */}
          <div className="flex flex-col items-center gap-6 mt-8">
            {/* Navigation Buttons */}
            <div className="flex gap-4 items-center justify-center">
              <motion.button
                onClick={handlePrevious}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-lg border border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-200"
              >
                <ChevronLeft className="w-6 h-6 text-primary" />
              </motion.button>

              <span className="text-muted-foreground font-mono text-sm px-4">
                {String(currentIndex + 1).padStart(2, '0')} / {String(REAL_BONDS.length).padStart(2, '0')}
              </span>

              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-lg border border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-200"
              >
                <ChevronRight className="w-6 h-6 text-primary" />
              </motion.button>
            </div>

            {/* Dot Indicators */}
            <div className="flex gap-2 flex-wrap justify-center max-w-md">
              {REAL_BONDS.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentIndex
                      ? 'w-3 h-3 bg-primary shadow-[0_0_12px_rgba(198,255,0,0.6)]'
                      : 'w-2 h-2 bg-primary/30 hover:bg-primary/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* @ts-ignore - Suppress intersection types warning */}
      <PurchaseModal 
        bond={selectedBond} 
        isOpen={!!selectedBond} 
        onClose={() => setSelectedBond(null)} 
      />
    </section>
  );
};


// --- Component: The "Terminal" Style Card ---
const DetailedBondCard = ({ bond, onBuy }: { bond: Bond; onBuy: () => void }) => {
  const isPositive = bond.priceChange24h >= 0;

  return (
    <div className="relative bg-[#0A0A0A] border border-white/10 rounded-lg p-6 max-w-3xl mx-auto shadow-2xl overflow-hidden group">
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50" />

      {/* Live Indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(198,255,0,0.5)]" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
          Live Market Feed
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* LEFT: Info Section */}
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
            onClick={() => {
              if (bond.status !== 'SOLD OUT' && bond.availability > 0) {
                onBuy();
              }
            }}
            disabled={bond.status === 'SOLD OUT' || bond.availability === 0}
            className={`w-full font-bold py-3 px-4 rounded transition-all transform uppercase tracking-wider text-sm ${
              bond.status === 'SOLD OUT' || bond.availability === 0
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                : 'bg-primary hover:bg-primary/90 text-black hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {bond.status === 'SOLD OUT' ? 'Sold Out' : 'Buy Now'}
          </button>
        </div>

        {/* RIGHT: Chart Section */}
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
                  type="monotone" 
                  dataKey="value" 
                  stroke={isPositive ? "#C6FF00" : "#EF4444"} 
                  strokeWidth={2} 
                  dot={false} 
                />
                <YAxis domain={['dataMin', 'dataMax']} hide />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Faux Chart Gradient Overlay */}
          <div className={`h-8 w-full mt-[-32px] bg-gradient-to-t ${isPositive ? 'from-green-500/10' : 'from-red-500/10'} to-transparent`} />
        </div>

      </div>
    </div>
  );
};