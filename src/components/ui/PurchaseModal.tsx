import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle, Activity, Wallet } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context'; 
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

export const PurchaseModal = ({ bond, isOpen, onClose }: PurchaseModalProps) => {
  // 1. HOOKS (MUST BE AT THE TOP)
  const { isConnected, currencyBalance, handleMint, transactionStatus } = useWeb3();
  
  const [amount, setAmount] = useState('');
  const [isSIP, setIsSIP] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [isSuccessLocal, setIsSuccessLocal] = useState(false);

  // 2. USEEFFECT (MOVED UP - Before any returns)
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setIsSIP(false);
      setIsSuccessLocal(false);
    }
  }, [isOpen]);

  // 3. CONDITIONAL RETURN (SAFE NOW)
  if (!bond) return null;

  // 4. REST OF THE LOGIC
  const walletBalance = parseFloat(currencyBalance || '0');
  const numericAmount = parseFloat(amount) || 0;
  const tokensReceived = numericAmount / 100; // ₹100 = 1 Token
  const isValid = numericAmount >= bond.minInvestment && numericAmount <= walletBalance;

  // Toggle Handler
  const handleSIPToggle = (checked: boolean) => {
    if (checked) {
      setShowConsent(true); 
    } else {
      setIsSIP(false); 
    }
  };

  const handlePurchase = async () => {
    if (!isValid) return;
    
    await handleMint(amount);

    const newHolding = {
      id: bond.id,
      name: bond.name || bond.shortName,
      amount: tokensReceived,
      timestamp: Date.now(),
      isSIP: isSIP,
      sipAmount: isSIP ? (numericAmount > 0 ? numericAmount : 100) : 0,
      sipNextDate: isSIP ? Date.now() + 120000 : null 
    };

    const existing = localStorage.getItem('bond_holdings');
    const history = existing ? JSON.parse(existing) : [];
    history.push(newHolding);
    localStorage.setItem('bond_holdings', JSON.stringify(history));

    setIsSuccessLocal(true);

    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleClose = () => {
    if (transactionStatus && transactionStatus !== 'SUCCESS!' && transactionStatus !== 'PAYMENT FAILED') return; 
    onClose();
  };

  const isProcessing = !!transactionStatus && transactionStatus !== 'SUCCESS!' && transactionStatus !== 'PAYMENT FAILED';
  const isError = transactionStatus === 'PAYMENT FAILED' || transactionStatus === 'ERROR';
  const isSuccess = transactionStatus === 'SUCCESS!' || isSuccessLocal;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* MODAL CONTAINER */}
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                className="w-full max-w-md pointer-events-auto"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
              >
                {/* CARD */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl relative overflow-hidden flex flex-col max-h-[85vh] text-white shadow-2xl">
                  
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 pointer-events-none" />
                  
                  {/* --- HEADER --- */}
                  <div className="relative z-10 flex-none p-6 pb-2 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold uppercase tracking-tight text-white">Purchase {bond.shortName}</h2>
                      <p className="text-sm text-gray-400">{bond.interestRate}% APY</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/5 transition-colors text-white" disabled={isProcessing}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* --- BODY --- */}
                  <div className="relative z-10 flex-1 overflow-y-auto p-6 py-2 custom-scrollbar">
                    
                    {!isProcessing && !isSuccess && !isError && (
                      <>
                        {/* Balance Display */}
                        <div className="mb-6 p-3 bg-white/5 rounded-lg flex justify-between items-center border border-white/5">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Wallet className="w-4 h-4" /> Wallet Balance
                            </div>
                            <div className="font-mono font-bold text-white">
                                ₹{currencyBalance}
                            </div>
                        </div>

                        <div className="mb-6">
                          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                            Investment Amount (eINR)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono">₹</span>
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder={`Min ₹${bond.minInvestment}`}
                              className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-16 py-3 text-lg font-mono focus:outline-none focus:border-primary transition-colors text-white placeholder:text-gray-600"
                            />
                            <button
                              onClick={() => setAmount(walletBalance.toString())}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80 transition-colors font-bold"
                            >
                              MAX
                            </button>
                          </div>
                        </div>

                        {/* SIP Toggle Card */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-tighter">
                              <Activity className="w-4 h-4" /> Enable Monthly SIP
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-tight">
                              Auto-invest ₹{amount || '100'} every 2 mins
                            </span>
                          </div>
                          <Switch 
                            checked={isSIP} 
                            onCheckedChange={handleSIPToggle}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>

                        {numericAmount > 0 && (
                          <motion.div className="bg-white/5 rounded-xl p-4 mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-400 font-medium">Tokens Received</span>
                              <span className="text-lg font-bold text-primary font-mono">{tokensReceived.toFixed(2)} BOND</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400 font-medium">Est. Yearly Yield</span>
                              <span className="text-sm font-semibold text-green-400">
                                +₹{((numericAmount * bond.interestRate) / 100).toFixed(2)}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}

                    {/* PROCESSING STATE */}
                    {isProcessing && (
                      <motion.div className="flex flex-col items-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-lg font-semibold text-white">{transactionStatus}</p>
                        <p className="text-sm text-gray-400 mt-2">Check your MetaMask wallet...</p>
                      </motion.div>
                    )}

                    {/* SUCCESS STATE */}
                    {isSuccess && (
                      <motion.div className="flex flex-col items-center py-12" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
                          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        </motion.div>
                        <p className="text-xl font-bold text-green-500 uppercase tracking-wider">Transaction Confirmed!</p>
                        <p className="text-sm text-gray-400 mt-2 text-center">
                          You received {tokensReceived.toFixed(2)} {bond.shortName} tokens.<br/>
                          {isSIP && "SIP Mandate Activated."}
                        </p>
                      </motion.div>
                    )}

                    {/* ERROR STATE */}
                    {isError && (
                      <motion.div className="flex flex-col items-center py-12" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                        <p className="text-xl font-bold text-red-500 uppercase tracking-wider">Failed</p>
                        <p className="text-sm text-gray-400 mt-2">Transaction rejected or failed.</p>
                      </motion.div>
                    )}
                  </div>

                  {/* --- FOOTER --- */}
                  {!isProcessing && !isSuccess && !isError && (
                    <div className="relative z-10 flex-none p-6 pt-2">
                      <Button
                        className="w-full py-6 text-lg bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider shadow-xl"
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

      {/* SIP CONSENT DIALOG */}
      <AlertDialog open={showConsent} onOpenChange={setShowConsent}>
        <AlertDialogContent className="bg-[#0A0A0A] border border-white/10 rounded-2xl z-[100] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white uppercase tracking-tight text-lg">SIP Mandate Authorization</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-sm leading-relaxed">
              By enabling this, you authorize <span className="text-primary font-bold">Bondify</span> to automatically deduct <span className="text-white font-bold">eINR</span> from your wallet every <span className="text-white font-bold underline">2 minutes</span>.
              <br /><br />
              <span className="text-xs opacity-70 italic">
                 This uses a "One-Time Approval" mechanism. You will sign the initial mandate now.
              </span>
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