import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Coins, BarChart3, Clock } from 'lucide-react';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { useBondify } from '@/hooks/useBondify';

interface Holding {
  id: string;
  name: string;
  amount: number;
  isSIP: boolean;
}

export const Portfolio = () => {
  const { isConnected, claimableYield, bondBalance, compoundYield } = useBondify(); 
  const [activeHoldings, setActiveHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    const stored = localStorage.getItem('bond_holdings');
    const rawHoldings = stored ? JSON.parse(stored) : [];

    // Group by ID to consolidate balances and SIP status
    const grouped: Record<string, Holding> = {};
    rawHoldings.forEach((tx: any) => {
      if (!grouped[tx.id]) {
        grouped[tx.id] = { 
          id: tx.id, 
          name: tx.name.replace(' (SIP)', ''), // Keep name clean
          amount: 0,
          isSIP: false 
        };
      }
      grouped[tx.id].amount += parseFloat(tx.amount);
      
      // If any transaction in history for this ID has isSIP enabled, mark the holding as SIP
      if (tx.isSIP) {
        grouped[tx.id].isSIP = true;
      }
    });

    // Filter valid holdings
    const final = Object.values(grouped).filter(h => h.amount > 0.01);
    
    // Calculate Totals based on this list
    const calculatedTokens = final.reduce((acc, curr) => acc + curr.amount, 0);
    const calculatedValue = calculatedTokens * 100;

    setActiveHoldings(final);
    setTotalTokens(calculatedTokens);
    setTotalValue(calculatedValue);

  }, [bondBalance, isConnected]); 

  return (
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <SummaryCard title="Total Value" value={totalValue} prefix="₹" icon={Wallet} index={0} />
              <SummaryCard title="Unclaimed Yield" value={parseFloat(claimableYield)} prefix="₹" icon={TrendingUp} iconColor="text-secondary" index={1} />
              <SummaryCard title="Bond Tokens" value={totalTokens} suffix="BOND" icon={Coins} index={2} />
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3 className="text-xl font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Active Holdings
              </h3>
              
              {activeHoldings.length > 0 ? (
                <div className="space-y-4">
                  {activeHoldings.map((h, i) => {
                    // Demo Logic: Simulate 0.15% yield per token for compounding display
                    const simulatedYield = h.amount * 0.15;
                    
                    return (
                      <motion.div 
                        key={h.id} 
                        className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group" 
                        initial={{ opacity: 0, x: -20 }} 
                        whileInView={{ opacity: 1, x: 0 }} 
                        viewport={{ once: true }}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                        
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-lg text-white">{h.name}</p>
                                {h.isSIP && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 animate-pulse">
                                        SIP ACTIVE
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">{h.amount.toFixed(2)} tokens</p>
                            
                            {/* SIP TIMER INDICATOR */}
                            {h.isSIP && (
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-primary/80 font-mono">
                                    <Clock className="w-3 h-3" />
                                    NEXT AUTO-INVEST: ~2 MINS
                                </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Yield Earned</p>
                            <p className="text-sm font-bold text-secondary font-mono">₹{simulatedYield.toFixed(2)}</p> 
                          </div>

                          {/* COMPOUND BUTTON */}
                          <button 
                            onClick={() => compoundYield(h.id, simulatedYield)}
                            className="px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary text-[10px] font-bold rounded-lg border border-secondary/30 transition-all uppercase tracking-widest hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(var(--secondary),0.1)]"
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
                  <p className="text-muted-foreground font-mono italic">No active bond investments found in history.</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};