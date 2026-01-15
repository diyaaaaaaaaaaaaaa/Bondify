import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { RedeemModal } from '@/components/ui/RedeemModal';
import { useBondify } from '@/hooks/useBondify';

// --- FIXED INTERFACE ---
// Includes all properties accessed by RedeemModal based on your error logs
export interface HoldingBond {
  id: string;
  bondId: string; // Added this missing field
  name: string;
  shortName: string;
  investedAmount: number;
  tokensOwned: number;
  yieldEarned: number;
  minInvestment: number;
  apy: number;
  
  // Legacy props that might be checked by the modal
  interestRate: number; 
  maturityPeriod: string;
  maturityYears: number;
  description: string;
  type: string;
  issuer: string;
  status: string;
  purchaseDate: string;
}

export const Redeem = () => {
  const { isConnected, bondBalance } = useBondify();
  const [selectedHolding, setSelectedHolding] = useState<HoldingBond | null>(null);

  const totalTokens = parseFloat(bondBalance || '0');

  // --- FIXED DATA OBJECT ---
  // Populated with all required fields
  const realHolding: HoldingBond | null = totalTokens > 0 ? {
    id: 'holding-1',
    bondId: 'goi-2033', // Matches the ID used in BondMarketplace
    name: '7.26% GS 2033',
    shortName: 'GOI 2033',
    investedAmount: totalTokens * 100,
    tokensOwned: totalTokens,
    yieldEarned: 0,
    minInvestment: 100,
    apy: 7.26,
    
    // Legacy mappings
    interestRate: 7.26,
    maturityPeriod: '9 Years',
    maturityYears: 9,
    description: 'Sovereign guarantee bond issued by GOI',
    type: 'Sovereign',
    issuer: 'Government of India',
    status: 'Active',
    purchaseDate: new Date().toISOString()
  } : null;

  return (
    <section id="redeem" className="min-h-screen py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-12" 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
        >
          <span className="text-xs text-accent uppercase tracking-widest font-mono">
            {'>'} Cash Out
          </span>
          <h2 className="heading-brutal text-4xl md:text-5xl mt-2 font-bold">
            REDEEM TOKENS
          </h2>
          <p className="text-muted-foreground mt-4">
            Convert your bond tokens back to USDC anytime. No lock-in period.
          </p>
        </motion.div>

        {/* Holdings Display */}
        {!isConnected || totalTokens === 0 ? (
          <motion.div 
            className="text-center py-20 bg-card border border-border rounded-2xl" 
            initial={{ opacity: 0 }} 
            whileInView={{ opacity: 1 }} 
            viewport={{ once: true }}
          >
            <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">
              {isConnected ? 'No tokens to redeem' : 'Connect wallet to view your holdings'}
            </p>
            {!isConnected && (
              <p className="text-sm text-muted-foreground/70 mt-2">
                You need to connect your wallet to see your bond holdings
              </p>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {/* Real Bond Holding Card */}
            {realHolding && (
              <motion.div 
                className="bg-card border border-border rounded-2xl p-6 hover:border-accent/50 transition-colors"
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Bond Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-xl">{realHolding.shortName}</h3>
                        <p className="text-sm text-muted-foreground">{realHolding.name}</p>
                      </div>
                      <div className="bg-accent/10 px-3 py-1 rounded-full">
                        <span className="text-xs font-mono text-accent">{realHolding.apy}% APY</span>
                      </div>
                    </div>

                    {/* Holdings Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Tokens Owned</span>
                        <span className="font-bold text-lg">{realHolding.tokensOwned.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Current Value</span>
                        <span className="font-bold text-lg">
                          ₹{(realHolding.tokensOwned * realHolding.minInvestment).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Invested Amount</span>
                        <span className="text-foreground">
                          ₹{realHolding.investedAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Yield Earned</span>
                        <span className="text-green-500">
                          +₹{realHolding.yieldEarned.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Redeem Button */}
                  <motion.button 
                    className="btn-redeem px-8 py-3 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-wider text-sm transition-all self-start md:self-center"
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedHolding(realHolding)}
                  >
                    Redeem
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Info Card */}
            <motion.div 
              className="bg-muted/30 border border-border/50 rounded-xl p-4 mt-4"
              initial={{ opacity: 0 }} 
              whileInView={{ opacity: 1 }} 
              viewport={{ once: true }} 
              transition={{ delay: 0.2 }}
            >
              <div className="flex gap-3">
                <div className="w-1 h-1 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">No Lock-in Period:</span> You can redeem your tokens anytime. 
                    Redemption converts your bond tokens back to USDC at the current rate of ₹{realHolding?.minInvestment} per token.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Redeem Modal */}
      <RedeemModal 
        holding={selectedHolding} 
        isOpen={!!selectedHolding} 
        onClose={() => setSelectedHolding(null)} 
      />
    </section>
  );
};