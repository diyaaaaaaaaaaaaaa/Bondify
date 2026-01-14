import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Coins, BarChart3 } from 'lucide-react';
import { SummaryCard } from '@/components/ui/SummaryCard';
import { useBondContext } from '@/context/BondContext';

export const Portfolio = () => {
  const { holdings, totalInvested, totalYieldEarned, totalTokens, wallet } = useBondContext();

  return (
    <section id="portfolio" className="min-h-screen py-24 px-6 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-xs text-primary uppercase tracking-widest">Your Assets</span>
          <h2 className="heading-brutal text-4xl md:text-5xl mt-2">Portfolio</h2>
        </motion.div>

        {!wallet.isConnected ? (
          <motion.div className="text-center py-20" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">Connect your wallet to view portfolio</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <SummaryCard title="Total Invested" value={totalInvested} prefix="₹" icon={Wallet} index={0} />
              <SummaryCard title="Yield Earned" value={totalYieldEarned} prefix="+₹" icon={TrendingUp} iconColor="text-secondary" index={1} />
              <SummaryCard title="Bond Tokens" value={totalTokens} suffix="BOND" icon={Coins} index={2} />
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <h3 className="text-xl font-bold uppercase tracking-tight mb-6">Holdings</h3>
              <div className="space-y-4">
                {holdings.map((holding, i) => (
                  <motion.div key={holding.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * i }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{holding.shortName}</p>
                        <p className="text-xs text-muted-foreground">{holding.tokensOwned} tokens</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold">₹{holding.investedAmount.toLocaleString()}</p>
                      <p className="text-xs text-secondary">+₹{holding.yieldEarned.toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};
