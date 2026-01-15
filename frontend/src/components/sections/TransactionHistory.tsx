import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Coins, Clock, CheckCircle } from 'lucide-react';
import { useBondify } from '@/hooks/useBondify';

export const TransactionHistory = () => {
  const { isConnected } = useBondify();

  // Define types
  type TxType = 'buy' | 'yield' | 'redeem';
  
  interface Transaction {
    id: number;
    type: TxType; // Use the specific union type
    bondName: string;
    amount: number;
    tokens: number;
    timestamp: string;
    status: 'completed' | 'pending';
  }

  // Explicitly type the array
  const transactions: Transaction[] = [
     { id: 1, type: 'buy', bondName: 'GOI 2033', amount: 5000, tokens: 50, timestamp: new Date().toISOString(), status: 'completed' }
  ];

  const typeIcons: Record<TxType, any> = { buy: ArrowDownLeft, yield: Coins, redeem: ArrowUpRight };
  const typeColors: Record<TxType, string> = { buy: 'text-primary', yield: 'text-secondary', redeem: 'text-accent' };

  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <section id="history" className="min-h-screen py-24 px-6 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-xs text-primary uppercase tracking-widest">Activity</span>
          <h2 className="heading-brutal text-4xl md:text-5xl mt-2">Transaction History</h2>
        </motion.div>

        {!isConnected ? (
          <motion.div className="text-center py-20" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">Connect wallet to view history</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, i) => {
              const Icon = typeIcons[tx.type];
              return (
                <motion.div key={tx.id} className="terminal-zone bg-card border border-border rounded-xl p-4 flex items-center justify-between" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 * i }}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${typeColors[tx.type]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold capitalize">{tx.type === 'yield' ? 'Yield Payout' : tx.type}</p>
                      <p className="text-xs text-muted-foreground">{tx.bondName} • {formatDate(tx.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className={`font-mono font-semibold ${tx.type === 'buy' ? '' : typeColors[tx.type]}`}>
                        {tx.type === 'buy' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                      </p>
                      {tx.tokens && <p className="text-xs text-muted-foreground">{tx.tokens} tokens</p>}
                    </div>
                    {tx.status === 'completed' ? <CheckCircle className="w-5 h-5 text-primary" /> : <Clock className="w-5 h-5 text-yellow-500" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};