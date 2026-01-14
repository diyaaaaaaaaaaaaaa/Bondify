import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { RedeemModal } from '@/components/ui/RedeemModal';
import { useBondContext } from '@/context/BondContext';
import { HoldingBond } from '@/data/mockBonds';

export const Redeem = () => {
  const { holdings, wallet } = useBondContext();
  const [selectedHolding, setSelectedHolding] = useState<HoldingBond | null>(null);

  return (
    <section id="redeem" className="min-h-screen py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-xs text-accent uppercase tracking-widest">Cash Out</span>
          <h2 className="heading-brutal text-4xl md:text-5xl mt-2">Redeem Tokens</h2>
          <p className="text-muted-foreground mt-4">Convert your bond tokens back to USDC anytime.</p>
        </motion.div>

        {!wallet.isConnected || holdings.length === 0 ? (
          <motion.div className="text-center py-20 bg-card border border-border rounded-2xl" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">{wallet.isConnected ? 'No tokens to redeem' : 'Connect wallet to redeem'}</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {holdings.map((holding, i) => (
              <motion.div key={holding.id} className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * i }} whileHover={{ borderColor: 'hsl(var(--accent) / 0.5)' }}>
                <div>
                  <h3 className="font-bold text-lg">{holding.shortName}</h3>
                  <p className="text-sm text-muted-foreground">{holding.tokensOwned} tokens available</p>
                  <p className="text-xs text-muted-foreground mt-1">Value: ₹{(holding.tokensOwned * holding.minInvestment).toLocaleString()}</p>
                </div>
                <motion.button className="btn-claim px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold uppercase tracking-wider text-sm" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedHolding(holding)}>
                  Redeem
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
