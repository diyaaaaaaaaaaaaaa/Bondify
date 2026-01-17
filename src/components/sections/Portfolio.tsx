import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, Coins, BarChart3, Clock, X, ShieldCheck, Activity, AlertTriangle } from 'lucide-react';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { useBondify } from '@/hooks/useBondify';
import { Button } from '@/components/ui/button';

interface Holding {
  id: string;
  name: string;
  amount: number;
  isSIP: boolean;
  sipAmount?: number;
  lastInteraction: number;
}

export const Portfolio = () => {
  const { isConnected, bondBalance, compoundYield, cancelSIP, yieldRate } = useBondify(); 
  
  const [activeHoldings, setActiveHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [selectedBond, setSelectedBond] = useState<Holding | null>(null);
  
  // NEW: State for the Total Yield Card
  const [totalUnclaimedYield, setTotalUnclaimedYield] = useState(0);

  // Live Ticker State
  const [now, setNow] = useState(Date.now());

  // 1. TICKER: Updates 'now' every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. DATA FETCHER: Reads storage whenever Balance changes
  useEffect(() => {
    if (!isConnected) return;

    const stored = localStorage.getItem('bond_holdings');
    const rawHoldings = stored ? JSON.parse(stored) : [];

    const grouped: Record<string, Holding> = {};
    rawHoldings.forEach((tx: any) => {
      if (!grouped[tx.id]) {
        grouped[tx.id] = { 
          id: tx.id, 
          name: tx.name.replace(' (SIP)', ''), 
          amount: 0, 
          isSIP: false,
          sipAmount: 0,
          lastInteraction: 0 
        };
      }
      grouped[tx.id].amount += parseFloat(tx.amount);
      
      // Find latest interaction time
      if (tx.timestamp > grouped[tx.id].lastInteraction) {
         grouped[tx.id].lastInteraction = tx.timestamp;
      }
      if (tx.isSIP) {
        grouped[tx.id].isSIP = true;
        grouped[tx.id].sipAmount = tx.sipAmount || 100;
      }
    });

    const final = Object.values(grouped).filter(h => h.amount > 0.01);
    const tTokens = final.reduce((acc, curr) => acc + curr.amount, 0);

    setActiveHoldings(final);
    setTotalTokens(tTokens);
    setTotalValue(tTokens * 100);

  }, [bondBalance, isConnected]); // Dependency on bondBalance ensures refresh after Compound

  // 3. YIELD CALCULATOR: Runs every second (dependent on 'now')
  useEffect(() => {
    if (activeHoldings.length === 0) {
        setTotalUnclaimedYield(0);
        return;
    }

    let sumYield = 0;
    const currentAPY = parseFloat(yieldRate) || 7.25;

    activeHoldings.forEach(h => {
        const secondsPassed = Math.max(0, (now - h.lastInteraction) / 1000);
        // Simulation: 1 Second = 1 Day
        const simulatedDays = secondsPassed * 1.0; 
        const yieldVal = (h.amount * 100) * (currentAPY / 100) * (simulatedDays / 365);
        sumYield += yieldVal;
    });

    setTotalUnclaimedYield(sumYield);

  }, [now, activeHoldings, yieldRate]);

  const handleStopSIP = async () => {
    if (selectedBond) {
      await cancelSIP(selectedBond.id);
      setSelectedBond(null); 
    }
  };

  return (
    <>
      <section id="portfolio" className="min-h-screen py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div className="mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="text-xs text-primary uppercase tracking-widest font-mono">{'>'} Your Assets</span>
            <h2 className="heading-brutal text-4xl md:text-5xl mt-2 font-bold uppercase tracking-tighter">Portfolio</h2>
          </motion.div>

          {!isConnected ? (
            <div className="text-center py-20 bg-card border border-border rounded-2xl">
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground font-mono">CONNECT WALLET TO VIEW ASSETS</p>
            </div>
          ) : (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <SummaryCard title="Total Value" value={totalValue} prefix="₹" icon={Wallet} index={0} />
                
                {/* FIXED: Now uses the live calculated 'totalUnclaimedYield' */}
                <SummaryCard 
                    title="Unclaimed Yield" 
                    value={totalUnclaimedYield} 
                    prefix="₹" 
                    icon={TrendingUp} 
                    iconColor="text-secondary" 
                    index={1} 
                />
                
                <SummaryCard title="Bond Tokens" value={totalTokens} suffix="BOND" icon={Coins} index={2} />
              </div>

              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Active Holdings
                </h3>
                
                {activeHoldings.length > 0 ? (
                  <div className="space-y-4">
                    {activeHoldings.map((h) => {
                      // Individual Card Logic (Same Formula)
                      const currentAPY = parseFloat(yieldRate) || 7.25;
                      const secondsPassed = Math.max(0, (now - h.lastInteraction) / 1000);
                      const simulatedDays = secondsPassed * 1.0; 
                      const simulatedYield = (h.amount * 100) * (currentAPY / 100) * (simulatedDays / 365);

                      return (
                        <motion.div 
                          key={h.id} 
                          onClick={() => setSelectedBond(h)} 
                          className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all"
                          initial={{ opacity: 0, x: -20 }} 
                          whileInView={{ opacity: 1, x: 0 }} 
                          viewport={{ once: true }}
                        >
                          {/* ... Card UI remains same ... */}
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <BarChart3 className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                  <p className="font-bold text-lg text-white group-hover:text-primary transition-colors">{h.name}</p>
                                  {h.isSIP && (
                                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 animate-pulse">
                                          SIP ACTIVE
                                      </span>
                                  )}
                              </div>
                              <p className="text-sm text-muted-foreground font-mono">{h.amount.toFixed(4)} tokens</p>
                              {h.isSIP && (
                                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-primary/80 font-mono">
                                      <Clock className="w-3 h-3" />
                                      NEXT: ~2 MINS (₹{h.sipAmount})
                                  </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Yield Earned</p>
                              <p className="text-sm font-bold text-secondary font-mono">₹{simulatedYield.toFixed(2)}</p> 
                            </div>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                if (simulatedYield > 0.01) compoundYield(h.id, simulatedYield);
                              }}
                              className={`px-4 py-2 text-[10px] font-bold rounded-lg border transition-all uppercase tracking-widest z-20 
                                ${simulatedYield > 0.01 
                                    ? 'bg-secondary/10 hover:bg-secondary/20 text-secondary border-secondary/30 hover:scale-105 active:scale-95' 
                                    : 'bg-muted/10 text-muted-foreground border-white/5 cursor-not-allowed opacity-50'}`}
                            >
                              Compound
                            </button>

                            <div className="text-right border-l border-white/5 pl-6 min-w-[120px]">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-mono">Value</p>
                              <p className="font-mono font-bold text-xl text-white">
                                  ₹{(h.amount * 100).toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                    <p className="text-muted-foreground font-mono italic">No active bond investments found.</p>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </section>
      
      {/* ... KEEP POPUP CODE AS IS ... */}
      <AnimatePresence>
        {selectedBond && (
            <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBond(null)}
            >
             {/* ... Popup Content from previous files ... */}
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl pointer-events-auto p-6 text-white">
                    <div className="flex justify-between mb-4">
                        <h2 className="font-bold uppercase">{selectedBond.name}</h2>
                        <button onClick={() => setSelectedBond(null)}><X/></button>
                    </div>
                    <p className="mb-4 text-sm text-gray-400">Manage your asset holding.</p>
                    {selectedBond.isSIP && (
                        <Button onClick={handleStopSIP} variant="destructive" className="w-full">Cancel SIP</Button>
                    )}
                </motion.div>
             </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};