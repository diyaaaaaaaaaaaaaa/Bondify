import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle } from 'lucide-react';
import { useBondify } from '@/hooks/useBondify';

export const TransactionHistory = () => {
  const { isConnected, bondBalance } = useBondify(); // bondBalance dependency ensures refresh
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) return;
    const stored = localStorage.getItem('bond_holdings');
    if (stored) {
      // Show all transactions (buys are +, redeems are -)
      const parsed = JSON.parse(stored).sort((a: any, b: any) => b.timestamp - a.timestamp);
      setHistory(parsed);
    }
  }, [isConnected, bondBalance]);

  return (
    <section id="history" className="min-h-screen py-24 px-6 bg-card/30 scroll-snap-align-start scroll-snap-stop">
      <div className="max-w-4xl mx-auto">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="heading-brutal text-4xl md:text-5xl mt-2">Transaction History</h2>
        </motion.div>

        {!isConnected ? <p className="text-center">Connect Wallet</p> : (
          <div className="space-y-3">
            {history.length > 0 ? history.map((tx, i) => {
              const isBuy = tx.amount > 0;
              return (
                <motion.div key={i} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isBuy ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                      {isBuy ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold">{isBuy ? 'Buy Bond' : 'Redeem Bond'}</p>
                      <p className="text-xs text-muted-foreground">{tx.name} • {new Date(tx.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-semibold ${isBuy ? 'text-primary' : 'text-accent'}`}>
                      {isBuy ? '-' : '+'}₹{Math.abs(tx.amount * 100).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      {Math.abs(tx.amount)} tokens <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                  </div>
                </motion.div>
              );
            }) : <p className="text-center text-muted-foreground">No history found.</p>}
          </div>
        )}
      </div>
    </section>
  );
};