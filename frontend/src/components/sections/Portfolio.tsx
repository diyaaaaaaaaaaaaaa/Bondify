import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Coins, BarChart3, ArrowUpRight } from 'lucide-react';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { useBondify } from '@/hooks/useBondify';

interface Holding {
  id: string;
  name: string;
  amount: number;
}

export const Portfolio = () => {
  const { isConnected, claimableYield, bondBalance } = useBondify(); // bondBalance triggers re-render
  const [activeHoldings, setActiveHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    const stored = localStorage.getItem('bond_holdings');
    const rawHoldings = stored ? JSON.parse(stored) : [];

    // Group by ID
    const grouped: Record<string, Holding> = {};
    rawHoldings.forEach((tx: any) => {
      if (!grouped[tx.id]) {
        grouped[tx.id] = { id: tx.id, name: tx.name, amount: 0 };
      }
      grouped[tx.id].amount += parseFloat(tx.amount);
    });

    // Filter valid holdings
    const final = Object.values(grouped).filter(h => h.amount > 0.01);
    
    // Calculate Totals based on THIS list, so they always match
    const calculatedTokens = final.reduce((acc, curr) => acc + curr.amount, 0);
    const calculatedValue = calculatedTokens * 100;

    setActiveHoldings(final);
    setTotalTokens(calculatedTokens);
    setTotalValue(calculatedValue);

  }, [bondBalance, isConnected]); // Re-run when global balance changes (after buy/redeem)

  return (
    <section id="portfolio" className="min-h-screen py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-xs text-primary uppercase tracking-widest">Your Assets</span>
          <h2 className="heading-brutal text-4xl md:text-5xl mt-2">Portfolio</h2>
        </motion.div>

        {!isConnected ? (
          <div className="text-center py-20"><p className="text-xl text-muted-foreground">Connect your wallet</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <SummaryCard title="Total Value" value={totalValue} prefix="₹" icon={Wallet} index={0} />
              <SummaryCard title="Unclaimed Yield" value={parseFloat(claimableYield)} prefix="₹" icon={TrendingUp} iconColor="text-secondary" index={1} />
              <SummaryCard title="Bond Tokens" value={totalTokens} suffix="BOND" icon={Coins} index={2} />
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3 className="text-xl font-bold uppercase tracking-tight mb-6">Active Holdings</h3>
              {activeHoldings.length > 0 ? (
                <div className="space-y-4">
                  {activeHoldings.map((h, i) => (
                    <motion.div key={h.id} className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><BarChart3 className="w-6 h-6 text-primary" /></div>
                        <div>
                          <p className="font-bold text-lg">{h.name}</p>
                          <p className="text-sm text-muted-foreground">{h.amount.toFixed(2)} tokens</p>
                        </div>
                      </div>
                      <div className="text-right w-full md:w-auto">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Value</p>
                        <p className="font-mono font-bold text-xl text-foreground">₹{(h.amount * 100).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : <div className="text-center py-12 border border-dashed border-white/10 rounded-xl"><p className="text-muted-foreground">No active bond investments.</p></div>}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};