import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Coins, BarChart3, ArrowUpRight } from 'lucide-react';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { useBondify } from '@/hooks/useBondify';

// Interface for local storage history
interface LocalHolding {
  id: string;
  name: string;
  amount: number;
  timestamp: number;
}

export const Portfolio = () => {
  const { 
    isConnected,
    bondBalance, 
    usdcBalance, 
    claimableYield,
    yieldRate
  } = useBondify();

  const [holdings, setHoldings] = useState<LocalHolding[]>([]);

  // Convert string balance to number
  const totalTokens = parseFloat(bondBalance || '0');
  const numericYield = parseFloat(claimableYield || '0');
  
  // Demo Logic: Calculate "Total Invested" based on current token balance * 100 USDC price
  const totalInvested = totalTokens * 100;

  // Effect: Sync blockchain balance with local "Card History"
  useEffect(() => {
    if (!isConnected) return;

    // 1. Try to get purchase history from local storage
    const stored = localStorage.getItem('bond_holdings');
    let localData: LocalHolding[] = stored ? JSON.parse(stored) : [];

    // 2. Reconciliation Logic (Hackathon specific)
    // If the blockchain says we have tokens, but local storage is empty,
    // create a "Default" holding so the user sees something.
    const localTotal = localData.reduce((acc, curr) => acc + curr.amount, 0);

    if (totalTokens > 0 && localTotal === 0) {
      // User likely bought via another browser or cleaned cache, restore a default entry
      localData = [{
        id: 'goi-2033',
        name: '7.26% GS 2033',
        amount: totalTokens,
        timestamp: Date.now()
      }];
      setHoldings(localData);
    } 
    // If blockchain balance is LOWER than local (user redeemed), scale down the local holdings
    else if (totalTokens < localTotal) {
      const ratio = totalTokens / localTotal;
      const adjusted = localData.map(h => ({...h, amount: h.amount * ratio})).filter(h => h.amount > 0.1);
      setHoldings(adjusted);
    } 
    else {
      setHoldings(localData);
    }
  }, [totalTokens, isConnected]);

  return (
    <section id="portfolio" className="min-h-screen py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-xs text-primary uppercase tracking-widest">Your Assets</span>
          <h2 className="heading-brutal text-4xl md:text-5xl mt-2">Portfolio</h2>
        </motion.div>

        {!isConnected ? (
          <motion.div className="text-center py-20" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">Connect your wallet to view portfolio</p>
          </motion.div>
        ) : (
          <>
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <SummaryCard title="Total Value" value={totalInvested} prefix="₹" icon={Wallet} index={0} />
              <SummaryCard title="Unclaimed Yield" value={numericYield} prefix="USDC " icon={TrendingUp} iconColor="text-secondary" index={1} />
              <SummaryCard title="Bond Tokens" value={totalTokens} suffix="BOND" icon={Coins} index={2} />
            </div>

            {/* Detailed Holdings List */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <h3 className="text-xl font-bold uppercase tracking-tight mb-6">Active Holdings</h3>
              
              {totalTokens > 0 ? (
                <div className="space-y-4">
                  {/* If we have specific history, show it. Otherwise show a generic 'GOI 2033' card */}
                  {(holdings.length > 0 ? holdings : [{id: 'gen', name: '7.26% GS 2033', amount: totalTokens}]).map((holding, i) => (
                    <motion.div 
                      key={i}
                      className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4" 
                      initial={{ opacity: 0, x: -20 }} 
                      whileInView={{ opacity: 1, x: 0 }} 
                      viewport={{ once: true }}
                    >
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{holding.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{holding.amount.toFixed(2)} tokens</span>
                            <span className="w-1 h-1 rounded-full bg-current" />
                            <span className="text-green-500 flex items-center">
                              <ArrowUpRight className="w-3 h-3 mr-1" />
                              {yieldRate || '7.26'}% APY
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right w-full md:w-auto bg-muted/20 p-4 rounded-lg md:bg-transparent md:p-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Value</p>
                        <p className="font-mono font-bold text-xl text-foreground">
                          ₹{(holding.amount * 100).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                 <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                   <p className="text-muted-foreground">No active bond investments.</p>
                   <a href="#marketplace" className="text-primary hover:underline text-sm mt-2 inline-block">Go to Marketplace</a>
                 </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};