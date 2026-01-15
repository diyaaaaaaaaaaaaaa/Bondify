import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle, Coins } from 'lucide-react';
import { useBondify } from '@/hooks/useBondify';
import { Button } from '@/components/ui/button';

export interface RedeemModalHolding {
  id: string;
  name: string; // Used for transaction history logging
  shortName: string; // Used for UI titles
  tokensOwned: number;
  minInvestment: number;
  [key: string]: any;
}

interface RedeemModalProps {
  holding: RedeemModalHolding | null;
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'input' | 'processing' | 'success' | 'error';

export const RedeemModal = ({ holding, isOpen, onClose }: RedeemModalProps) => {
  const { isConnected, redeemTokens } = useBondify(); 
  const [tokens, setTokens] = useState('');
  const [state, setState] = useState<ModalState>('input');

  if (!holding) return null;

  const numericTokens = parseFloat(tokens) || 0;
  const redeemAmount = numericTokens * 100; // 1 token = ₹100
  const isValid = numericTokens > 0 && numericTokens <= holding.tokensOwned;

  const handleRedeem = async () => {
    if (!isValid) return;
    
    setState('processing');
    
    try {
      // Pass tokens, ID, and Name to the Web3Context function
      const success = await redeemTokens(tokens, holding.id, holding.name);
      
      if (success) {
        setState('success');
        setTimeout(() => {
          setState('input');
          setTokens('');
          onClose();
        }, 2000);
      } else {
        setState('error');
      }
    } catch (error) {
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
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/5" />
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight text-white">Redeem {holding.shortName}</h2>
                    <p className="text-sm text-muted-foreground">
                      Balance: {holding.tokensOwned.toFixed(2)} tokens
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full hover:bg-muted transition-colors text-white"
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
                          placeholder="0.00"
                          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-accent transition-colors"
                        />
                        <button
                          onClick={() => setTokens(holding.tokensOwned.toString())}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent font-bold hover:text-accent/80 transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    {/* Preview Area */}
                    {numericTokens > 0 && (
                      <motion.div
                        className="bg-muted/50 rounded-xl p-4 mb-6 border border-accent/20"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Coins className="w-4 h-4 text-accent" />
                          <span className="text-sm text-muted-foreground font-medium">Estimated Payout</span>
                        </div>
                        <p className="text-3xl font-bold text-accent font-mono">
                          ₹{redeemAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-tighter">
                          Funds will be credited to your eINR wallet balance
                        </p>
                      </motion.div>
                    )}

                    {/* Action Button */}
                    <Button
                      className={`w-full py-6 text-lg font-bold uppercase tracking-wider transition-all duration-300 ${
                        isValid ? 'bg-accent hover:bg-accent/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                      onClick={handleRedeem}
                      disabled={!isValid}
                    >
                      {numericTokens > holding.tokensOwned 
                        ? 'Insufficient Balance' 
                        : isValid 
                          ? `Confirm Redemption` 
                          : 'Enter Amount'}
                    </Button>
                  </>
                )}

                {state === 'processing' && (
                  <motion.div className="flex flex-col items-center py-8 text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <p className="text-lg font-semibold uppercase font-mono tracking-widest">Processing...</p>
                    <p className="text-xs text-muted-foreground mt-2">Securing your eINR payout</p>
                  </motion.div>
                )}

                {state === 'success' && (
                  <motion.div className="flex flex-col items-center py-8 text-white" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                    <CheckCircle className="w-16 h-16 text-accent mb-4" />
                    <p className="text-xl font-bold text-accent uppercase tracking-wider">Success!</p>
                    <p className="text-sm text-muted-foreground mt-1 text-center px-4">
                      Tokens burned. ₹{redeemAmount.toLocaleString()} added to your balance.
                    </p>
                  </motion.div>
                )}

                {state === 'error' && (
                  <motion.div className="flex flex-col items-center py-8 text-white" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                    <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                    <p className="text-xl font-bold text-destructive uppercase tracking-wider">Failed</p>
                    <p className="text-sm text-muted-foreground mt-1">Check network or balance.</p>
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