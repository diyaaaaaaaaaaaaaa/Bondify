import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { RedeemModal } from '@/components/ui/RedeemModal';
import { useBondify } from '@/hooks/useBondify';

export interface HoldingBond {
  id: string;
  name: string;
  shortName: string;
  tokensOwned: number;
  minInvestment: number;
  apy: number;
}

export const Redeem = () => {
  // 1. ADDED: bondBalance to destructuring
  const { isConnected, bondBalance } = useBondify();
  
  const [selectedHolding, setSelectedHolding] = useState<HoldingBond | null>(null);
  const [consolidatedHoldings, setConsolidatedHoldings] = useState<HoldingBond[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    // Force read latest data from storage
    const stored = localStorage.getItem('bond_holdings');
    const rawHoldings = stored ? JSON.parse(stored) : [];

    // Consolidate: Group by Bond ID
    const grouped: Record<string, HoldingBond> = {};

    rawHoldings.forEach((tx: any) => {
      // If we haven't seen this bond ID yet, initialize it
      if (!grouped[tx.id]) {
        grouped[tx.id] = {
          id: tx.id,
          name: tx.name.replace(' (SIP)', ''), // Clean up name
          shortName: tx.name.split(' (')[0], 
          tokensOwned: 0,
          minInvestment: 100, 
          apy: 7.26 
        };
      }
      
      const amount = parseFloat(tx.amount);
      grouped[tx.id].tokensOwned += amount;
    });

    // Filter: Only show bonds where you still own tokens
    const activeHoldings = Object.values(grouped).filter(h => h.tokensOwned > 0.01);
    
    setConsolidatedHoldings(activeHoldings);

  }, [isConnected, selectedHolding, bondBalance]); // 2. ADDED: bondBalance here triggers the refresh

  return (
    <section id="redeem" className="min-h-screen py-24 px-6 scroll-snap-align-start scroll-snap-stop">
      <div className="max-w-4xl mx-auto">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-xs text-accent uppercase tracking-widest font-mono">{'>'} Cash Out</span>
          <h2 className="heading-brutal text-4xl md:text-5xl mt-2 font-bold">REDEEM TOKENS</h2>
          <p className="text-muted-foreground mt-4">Convert your bond tokens back to Rupees anytime.</p>
        </motion.div>

        {!isConnected || consolidatedHoldings.length === 0 ? (
          <motion.div className="text-center py-20 bg-card border border-border rounded-2xl" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">{isConnected ? 'No active holdings to redeem' : 'Connect wallet to view holdings'}</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {consolidatedHoldings.map((holding) => (
              <motion.div key={holding.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-xl">{holding.name}</h3>
                    <span className="bg-accent/10 px-2 py-1 rounded text-xs font-mono text-accent">{holding.apy.toFixed(2)}% APY</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Tokens Owned</span>
                      <span className="font-bold text-lg">{holding.tokensOwned.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Current Value</span>
                      <span className="font-bold text-lg">₹{(holding.tokensOwned * 100).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                </div>
                <motion.button 
                  className="btn-redeem px-8 py-3 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-wider text-sm w-full md:w-auto"
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedHolding(holding)}
                >
                  REDEEM
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <RedeemModal holding={selectedHolding} isOpen={!!selectedHolding} onClose={() => setSelectedHolding(null)} />
    </section>
  );
};