import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { useBondify } from '@/hooks/useBondify';
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { isConnected, currencyBalance, mintBond } = useBondify();
  
  const walletBalance = parseFloat(currencyBalance || '0');

  const [amount, setAmount] = useState('');
  const [isSIP, setIsSIP] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [state, setState] = useState<ModalState>('input');

  if (!bond) return null;

  const numericAmount = parseFloat(amount) || 0;
  const tokensReceived = Math.floor(numericAmount / 100); 
  const isValid = numericAmount >= bond.minInvestment && numericAmount <= walletBalance;

  // Toggle Handler
  const handleSIPToggle = (checked: boolean) => {
    if (checked) {
      setShowConsent(true); // Open Consent Dialog
    } else {
      setIsSIP(false); // Turn off immediately
    }
  };

  const handlePurchase = async () => {
    if (!isValid) return;
    
    setState('processing');
    
    try {
      // 1. Execute Chain Transaction (Simulation)
      await mintBond(numericAmount.toString()); 
      
      setState('success');

      // 2. Persist Data with SIP Logic
      const newHolding = {
        id: bond.id,
        name: bond.name || bond.shortName,
        amount: tokensReceived,
        timestamp: Date.now(),
        isSIP: isSIP,
        // Set next auto-invest for 2 minutes from now (Simulation)
        sipNextDate: isSIP ? Date.now() + 120000 : null 
      };

      const existing = localStorage.getItem('bond_holdings');
      const history = existing ? JSON.parse(existing) : [];
      history.push(newHolding);
      localStorage.setItem('bond_holdings', JSON.stringify(history));

      // 3. Close Modal after delay
      setTimeout(() => {
        setState('input');
        setAmount('');
        setIsSIP(false);
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
    setIsSIP(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* BACKDROP: z-40 (Lower than Alert Dialog) */}
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* MODAL CONTAINER: z-40, Centered Flex Layout */}
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                className="w-full max-w-md pointer-events-auto"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
              >
                {/* CARD: Flex Column Layout ensures Button is always visible */}
                <div className="bg-card border border-border rounded-3xl relative overflow-hidden flex flex-col max-h-[85vh] text-card-foreground shadow-2xl">
                  
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
                  
                  {/* --- HEADER (Fixed) --- */}
                  <div className="relative z-10 flex-none p-6 pb-2 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold uppercase tracking-tight text-white">Purchase {bond.shortName}</h2>
                      <p className="text-sm text-muted-foreground">{bond.interestRate}% APY</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-muted transition-colors text-white" disabled={state === 'processing'}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* --- BODY (Scrollable) --- */}
                  <div className="relative z-10 flex-1 overflow-y-auto p-6 py-2 custom-scrollbar">
                    {state === 'input' && (
                      <>
                        <div className="mb-6">
                          <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                            Investment Amount (₹)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder={`Min ₹${bond.minInvestment}`}
                              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:border-primary transition-colors text-white"
                            />
                            <button
                              onClick={() => setAmount(walletBalance.toString())}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80 transition-colors font-bold"
                            >
                              MAX
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 font-mono">
                            Available: ₹{walletBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                        </div>

                        {/* SIP Toggle Card */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-tighter">
                              <Activity className="w-4 h-4" /> Enable Monthly SIP
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                              Auto-invest ₹100 every 2 mins (Demo)
                            </span>
                          </div>
                          <Switch 
                            checked={isSIP} 
                            onCheckedChange={handleSIPToggle}
                            className="data-[state=checked]:bg-primary scale-110"
                          />
                        </div>

                        {numericAmount > 0 && (
                          <motion.div className="bg-muted/50 rounded-xl p-4 mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-muted-foreground font-medium">Tokens Received</span>
                              <span className="text-lg font-bold text-primary font-mono">{tokensReceived} BOND</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground font-medium">Est. Yearly Yield</span>
                              <span className="text-sm font-semibold text-secondary">
                                +₹{((numericAmount * bond.interestRate) / 100).toFixed(2)}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}

                    {state === 'processing' && (
                      <motion.div className="flex flex-col items-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-lg font-semibold text-white">Processing Transaction...</p>
                        <p className="text-sm text-muted-foreground">Confirm in your wallet</p>
                      </motion.div>
                    )}

                    {state === 'success' && (
                      <motion.div className="flex flex-col items-center py-12" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
                          <CheckCircle className="w-16 h-16 text-primary mb-4" />
                        </motion.div>
                        <p className="text-xl font-bold text-primary uppercase tracking-wider">Success!</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          You received {tokensReceived} {bond.shortName} tokens
                        </p>
                      </motion.div>
                    )}

                    {state === 'error' && (
                      <motion.div className="flex flex-col items-center py-12" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                        <p className="text-xl font-bold text-destructive uppercase tracking-wider">Failed</p>
                        <p className="text-sm text-muted-foreground">Check balance or connection.</p>
                      </motion.div>
                    )}
                  </div>

                  {/* --- FOOTER (Fixed at Bottom) --- */}
                  {state === 'input' && (
                    <div className="relative z-10 flex-none p-6 pt-2">
                      <Button
                        className="btn-buy w-full py-6 text-lg glow-green font-bold uppercase tracking-wider shadow-xl"
                        onClick={handlePurchase}
                        disabled={!isValid || !isConnected}
                      >
                        {!isConnected 
                          ? 'Connect Wallet First' 
                          : !isValid 
                            ? (numericAmount > walletBalance ? 'Insufficient Funds' : `Min. ₹${bond.minInvestment}`)
                            : `Confirm Purchase`}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* SIP CONSENT DIALOG - Explicit High Z-Index */}
      <AlertDialog open={showConsent} onOpenChange={setShowConsent}>
        <AlertDialogContent className="bg-[#0A0A0A] border border-white/10 rounded-2xl z-[100] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white uppercase tracking-tight text-lg">SIP Mandate Authorization</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              By enabling this, you authorize <span className="text-primary font-bold">Bondify</span> to automatically deduct <span className="text-white font-bold">₹100</span> from your Digital Rupee (eINR) wallet every <span className="text-white font-bold underline">2 minutes</span>.
              <br /><br />
              <span className="text-xs opacity-70 italic">This is a simulation of a recurring blockchain transaction.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setIsSIP(false)}
              className="bg-transparent border-white/10 text-white hover:bg-white/5 rounded-xl"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setIsSIP(true); 
                setShowConsent(false);
              }}
              className="bg-primary text-black font-bold hover:bg-primary/90 rounded-xl"
            >
              I Authorize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};