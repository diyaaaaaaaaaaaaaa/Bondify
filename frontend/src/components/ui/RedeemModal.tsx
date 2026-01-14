import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle, Coins } from 'lucide-react';
import { HoldingBond } from '@/data/mockBonds';
import { useBondContext } from '@/context/BondContext';
import { Button } from '@/components/ui/button';

interface RedeemModalProps {
  holding: HoldingBond | null;
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'input' | 'processing' | 'success' | 'error';

export const RedeemModal = ({ holding, isOpen, onClose }: RedeemModalProps) => {
  const { redeemTokens } = useBondContext();
  const [tokens, setTokens] = useState('');
  const [state, setState] = useState<ModalState>('input');

  if (!holding) return null;

  const numericTokens = parseInt(tokens) || 0;
  const redeemAmount = numericTokens * holding.minInvestment;
  const isValid = numericTokens > 0 && numericTokens <= holding.tokensOwned;

  const handleRedeem = async () => {
    if (!isValid) return;
    
    setState('processing');
    
    const success = await redeemTokens(holding.id, numericTokens);
    
    if (success) {
      setState('success');
      setTimeout(() => {
        setState('input');
        setTokens('');
        onClose();
      }, 2000);
    } else {
      setState('error');
      setTimeout(() => setState('input'), 3000);
    }
  };

  const handleClose = () => {
    if (state === 'processing') return;
    setState('input');
    setTokens('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101]"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="bg-card border border-border rounded-3xl p-6 mx-4 relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/5" />
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight">Redeem {holding.shortName}</h2>
                    <p className="text-sm text-muted-foreground">
                      Balance: {holding.tokensOwned} tokens
                    </p>
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
                    {/* Token Input */}
                    <div className="mb-4">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                        Tokens to Redeem
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={tokens}
                          onChange={(e) => setTokens(e.target.value)}
                          placeholder="Enter amount"
                          max={holding.tokensOwned}
                          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:border-accent transition-colors"
                        />
                        <button
                          onClick={() => setTokens(holding.tokensOwned.toString())}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent hover:text-accent/80 transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    {/* Preview */}
                    {numericTokens > 0 && (
                      <motion.div
                        className="bg-muted/50 rounded-xl p-4 mb-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Coins className="w-5 h-5 text-accent" />
                          <span className="text-sm text-muted-foreground">Expected Payout</span>
                        </div>
                        <p className="text-3xl font-bold text-accent font-mono">
                          ₹{redeemAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Will be sent to your wallet as USDC
                        </p>
                      </motion.div>
                    )}

                    {/* Redeem Button */}
                    <Button
                      className="btn-redeem w-full py-6 text-lg bg-accent hover:bg-accent/90 glow-purple"
                      onClick={handleRedeem}
                      disabled={!isValid}
                    >
                      {!isValid 
                        ? 'Enter Valid Amount' 
                        : `Redeem ₹${redeemAmount.toLocaleString()}`}
                    </Button>
                  </>
                )}

                {state === 'processing' && (
                  <motion.div
                    className="flex flex-col items-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <p className="text-lg font-semibold">Processing Redemption...</p>
                    <p className="text-sm text-muted-foreground">Burning tokens...</p>
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
                      <CheckCircle className="w-16 h-16 text-accent mb-4" />
                    </motion.div>
                    <p className="text-xl font-bold text-accent">Redemption Successful!</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{redeemAmount.toLocaleString()} sent to your wallet
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
                    <p className="text-xl font-bold text-destructive">Redemption Failed</p>
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
