import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useBondify } from '@/hooks/useBondify';
import { Button } from '@/components/ui/button';

export interface PurchaseModalBond {
  id: string;
  name: string;
  shortName: string;
  interestRate: number;
  minInvestment: number;
  [key: string]: any; 
}

interface PurchaseModalProps {
  bond: PurchaseModalBond | null;
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'input' | 'processing' | 'success' | 'error';

export const PurchaseModal = ({ bond, isOpen, onClose }: PurchaseModalProps) => {
  const { isConnected, usdcBalance, mintBond } = useBondify();
  
  const walletBalance = parseFloat(usdcBalance || '0');

  const [amount, setAmount] = useState('');
  const [state, setState] = useState<ModalState>('input');

  if (!bond) return null;

  const numericAmount = parseFloat(amount) || 0;
  const tokensReceived = Math.floor(numericAmount / bond.minInvestment);
  const isValid = numericAmount >= bond.minInvestment && numericAmount <= walletBalance;

  const handlePurchase = async () => {
    if (!isValid) return;
    
    setState('processing');
    
    try {
      await mintBond(numericAmount.toString()); 
      
      setState('success');

      // --- PERSISTENCE LOGIC START ---
      const newHolding = {
        id: bond.id,
        name: bond.name || bond.shortName,
        amount: tokensReceived,
        timestamp: Date.now()
      };
      const existing = localStorage.getItem('bond_holdings');
      const history = existing ? JSON.parse(existing) : [];
      history.push(newHolding);
      localStorage.setItem('bond_holdings', JSON.stringify(history));
      // --- PERSISTENCE LOGIC END ---

      setTimeout(() => {
        setState('input');
        setAmount('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      setState('error');
      setTimeout(() => setState('input'), 3000);
    }
  };

  const handleClose = () => {
    if (state === 'processing') return;
    setState('input');
    setAmount('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101]"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="bg-card border border-border rounded-3xl p-6 mx-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight">Purchase {bond.shortName}</h2>
                    <p className="text-sm text-muted-foreground">{bond.interestRate}% APY</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    disabled={state === 'processing'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {state === 'input' && (
                  <>
                    <div className="mb-4">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                        Investment Amount (USDC)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder={`Min ₹${bond.minInvestment}`}
                          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:border-primary transition-colors"
                        />
                        <button
                          onClick={() => setAmount(walletBalance.toString())}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Available: ${walletBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                      </p>
                    </div>

                    {numericAmount > 0 && (
                      <motion.div
                        className="bg-muted/50 rounded-xl p-4 mb-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Tokens Received</span>
                          <span className="text-lg font-bold text-primary font-mono">{tokensReceived} BOND</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Est. Yearly Yield</span>
                          <span className="text-sm font-semibold text-secondary">
                            +₹{((numericAmount * bond.interestRate) / 100).toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    <Button
                      className="btn-buy w-full py-6 text-lg glow-green"
                      onClick={handlePurchase}
                      disabled={!isValid || !isConnected}
                    >
                      {!isConnected 
                        ? 'Connect Wallet First' 
                        : !isValid 
                          ? `Min. ₹${bond.minInvestment}` 
                          : `Confirm Purchase`}
                    </Button>
                  </>
                )}

                {state === 'processing' && (
                  <motion.div
                    className="flex flex-col items-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-lg font-semibold">Processing Transaction...</p>
                    <p className="text-sm text-muted-foreground">Confirm in your wallet</p>
                  </motion.div>
                )}

                {state === 'success' && (
                  <motion.div
                    className="flex flex-col items-center py-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 10 }}
                    >
                      <CheckCircle className="w-16 h-16 text-primary mb-4" />
                    </motion.div>
                    <p className="text-xl font-bold text-primary">Transaction Successful!</p>
                    <p className="text-sm text-muted-foreground">
                      You received {tokensReceived} {bond.shortName} tokens
                    </p>
                  </motion.div>
                )}

                {state === 'error' && (
                  <motion.div
                    className="flex flex-col items-center py-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                    <p className="text-xl font-bold text-destructive">Transaction Failed</p>
                    <p className="text-sm text-muted-foreground">Please try again</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};