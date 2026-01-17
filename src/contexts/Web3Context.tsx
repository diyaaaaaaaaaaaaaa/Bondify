import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';

// Contract addresses on Avalanche Fuji
const CONTRACTS = {
  identityRegistry: '0x24a20E821A5d8C8aC4C676743c253D765c53bCB2',
  bondToken: '0xBf5b6E65a930589159b78F34B6Cdc820Ff809BdF',
  usdcToken: '0x5425890298aed601595a70AB815c96711a31Bc65',
  yieldDistributor: '0xdC67f40c28A73762e0DffB582254183EfF0f8540',
};

const FUJI_CHAIN_ID = '0xa869';

const BOND_TOKEN_ABI = ["function balanceOf(address) view returns (uint256)", "function mint(address to, uint256 amount)", "function transfer(address to, uint256 value) returns (bool)"];
const USDC_ABI = ["function balanceOf(address) view returns (uint256)"];
const YIELD_ABI = ["function claimYield()", "function calculateClaimableYield(address) view returns (uint256)", "function yieldRateBps() view returns (uint256)"];

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isVerified: boolean;
  bondBalance: string;
  currencyBalance: string;
  claimableYield: string;
  yieldRate: string;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  switchToFuji: () => Promise<void>;
  handleMint: (amount: string) => Promise<void>;
  handleClaim: () => Promise<void>;
  compoundYield: (bondId: string, amount: number) => Promise<void>;
  redeemTokens: (amount: string, bondId: string, bondName: string) => Promise<boolean>;
  cancelSIP: (bondId: string) => Promise<void>; // <--- NEW: Function to stop SIP
  refreshBalances: () => Promise<void>;
  setTransactionStatus: (status: string) => void;
  transactionStatus: string;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error('useWeb3 must be used within Web3Provider');
  return context;
};

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  
  const [bondBalance, setBondBalance] = useState(() => localStorage.getItem('sim_bondBalance') || '0');
  const [currencyBalance, setCurrencyBalance] = useState(() => localStorage.getItem('sim_currencyBalance') || '50000.00');
  
  const [claimableYield, setClaimableYield] = useState('0');
  const [yieldRate, setYieldRate] = useState('7.25');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');

  // Persist balances
  useEffect(() => {
    localStorage.setItem('sim_bondBalance', bondBalance);
    localStorage.setItem('sim_currencyBalance', currencyBalance);
  }, [bondBalance, currencyBalance]);

  // --- BACKGROUND SIP WORKER (2-Minute Simulation) ---
  useEffect(() => {
    if (!isConnected) return;

    const sipInterval = setInterval(() => {
      const stored = localStorage.getItem('bond_holdings');
      if (!stored) return;

      let history = JSON.parse(stored);
      let updated = false;
      const now = Date.now();
      const newEntries: any[] = [];

      history.forEach((bond: any) => {
        // If bond has an active SIP and the timer (120,000ms) has passed
        if (bond.isSIP && bond.sipNextDate && now >= bond.sipNextDate) {
          
          // UPDATED: Use the specific amount chosen by user, or default to 100
          const sipAmountRupees = bond.sipAmount || 100; 
          const currentBalance = parseFloat(currencyBalance);

          if (currentBalance >= sipAmountRupees) {
            const tokensToBuy = sipAmountRupees / 100; // Calculate tokens (e.g. 500rs = 5 tokens)

            // 1. Create the Auto-Purchase entry
            const autoPurchase = {
              id: bond.id,
              name: `${bond.name} (SIP)`,
              amount: tokensToBuy,
              timestamp: now,
              isSIP: true,
              sipAmount: sipAmountRupees, // Pass the custom amount forward
              sipNextDate: now + 120000 // Queue next one for 2 mins later
            };

            // 2. Disable the timer on the previous record to avoid double-processing
            bond.sipNextDate = null; 
            
            newEntries.push(autoPurchase);
            
            // 3. Update Global State
            setCurrencyBalance(prev => (parseFloat(prev) - sipAmountRupees).toFixed(2));
            setBondBalance(prev => (parseFloat(prev) + tokensToBuy).toString());
            
            updated = true;
            console.log(`[SIP Worker] Auto-investment of ₹${sipAmountRupees} executed for ${bond.name}`);
          }
        }
      });

      if (updated) {
        localStorage.setItem('bond_holdings', JSON.stringify([...history, ...newEntries]));
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(sipInterval);
  }, [isConnected, currencyBalance, bondBalance]);

  const checkMetaMask = () => typeof window.ethereum !== 'undefined';

  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const isCorrect = chainId === FUJI_CHAIN_ID;
      setIsCorrectNetwork(isCorrect);
      return isCorrect;
    } catch { return false; }
  };

  const switchToFuji = async () => {
    if (!checkMetaMask()) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: FUJI_CHAIN_ID }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: FUJI_CHAIN_ID,
            chainName: 'Avalanche Fuji Testnet',
            nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
            rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
            blockExplorerUrls: ['https://testnet.snowtrace.io/'],
          }],
        });
      }
    }
  };

  const connectWallet = async () => {
    if (!checkMetaMask()) { alert('Install MetaMask'); return; }
    try {
      setTransactionStatus('CONNECTING...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        const correct = await checkNetwork();
        if (!correct) await switchToFuji();
        setTransactionStatus('');
      }
    } catch (e) { console.error(e); setTransactionStatus(''); }
  };

  const handleMint = async (amount: string) => {
    if (!isConnected) { alert('Connect Wallet'); return; }
    try {
      setTransactionStatus('APPROVING...');
      await new Promise(r => setTimeout(r, 800));
      setTransactionStatus('MINTING...');
      await new Promise(r => setTimeout(r, 1000));
      setTransactionStatus('SUCCESS!');
      
      setBondBalance((prev) => (parseFloat(prev) + parseFloat(amount) / 100).toString());
      setCurrencyBalance((prev) => (parseFloat(prev) - parseFloat(amount)).toFixed(2));

    } catch (error: any) {
      console.error(error);
      setTransactionStatus('ERROR');
    }
    setTimeout(() => setTransactionStatus(''), 3000);
  };

  const handleClaim = async () => {
    if (!isConnected) return;
    setTransactionStatus('CLAIMING...');
    await new Promise(r => setTimeout(r, 1500));
    setTransactionStatus('CLAIMED!');
    setTimeout(() => setTransactionStatus(''), 2000);
  };

  // --- Feature 3: Yield Compounding ---
  const compoundYield = async (bondId: string, amount: number) => {
    setTransactionStatus('COMPOUNDING...');
    try {
      await new Promise(r => setTimeout(r, 1500));
      
      const newTokens = amount / 100; // ₹100 = 1 Token
      setBondBalance(prev => (parseFloat(prev) + newTokens).toString());

      const stored = localStorage.getItem('bond_holdings');
      const history = stored ? JSON.parse(stored) : [];
      
      history.push({
        id: bondId,
        name: "Yield Reinvestment",
        amount: newTokens,
        timestamp: Date.now(),
        type: 'compound'
      });
      
      localStorage.setItem('bond_holdings', JSON.stringify(history));
      setTransactionStatus('SUCCESS!');
    } catch (e) {
      setTransactionStatus('ERROR');
    }
    setTimeout(() => setTransactionStatus(''), 2000);
  };

  const redeemTokens = async (amount: string, bondId: string, bondName: string) => {
    setTransactionStatus('REDEEMING...');
    try {
      await new Promise(r => setTimeout(r, 2000));
      const redeemedTokens = parseFloat(amount);
      const refundRupees = redeemedTokens * 100;

      setBondBalance((prev) => Math.max(0, parseFloat(prev) - redeemedTokens).toString());
      setCurrencyBalance((prev) => (parseFloat(prev) + refundRupees).toFixed(2));

      const stored = localStorage.getItem('bond_holdings');
      const history = stored ? JSON.parse(stored) : [];
      history.push({
        id: bondId,
        name: bondName,
        amount: -redeemedTokens,
        timestamp: Date.now(),
        type: 'redeem'
      });
      localStorage.setItem('bond_holdings', JSON.stringify(history));

      setTransactionStatus('SUCCESS!');
      setTimeout(() => setTransactionStatus(''), 2000);
      return true;
    } catch (e) {
      setTransactionStatus('ERROR');
      setTimeout(() => setTransactionStatus(''), 2000);
      return false;
    }
  };

  // --- NEW: Cancel SIP Function ---
  const cancelSIP = async (bondId: string) => {
    setTransactionStatus('CANCELLING SIP...');
    try {
        await new Promise(r => setTimeout(r, 1000));
        
        const stored = localStorage.getItem('bond_holdings');
        if (stored) {
            const history = JSON.parse(stored);
            
            // Iterate through history and disable SIP for all matching bond entries
            const updatedHistory = history.map((h: any) => {
                if (h.id === bondId) {
                    return { ...h, isSIP: false, sipNextDate: null };
                }
                return h;
            });
            
            localStorage.setItem('bond_holdings', JSON.stringify(updatedHistory));
            
            // Force a re-render by touching state (cleanest way in simulation)
            setBondBalance(prev => prev); 
        }
        
        setTransactionStatus('SIP STOPPED');
    } catch (e) {
        console.error(e);
        setTransactionStatus('ERROR');
    }
    setTimeout(() => setTransactionStatus(''), 2000);
  };

  const refreshBalances = async () => {};

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accs: string[]) => {
        if (accs.length) setAccount(accs[0]);
        else setIsConnected(false);
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{
      account, isConnected, isVerified, bondBalance, currencyBalance,
      claimableYield, yieldRate, isCorrectNetwork,
      connectWallet, switchToFuji, handleMint, handleClaim, 
      compoundYield, redeemTokens, cancelSIP, // Exported here
      refreshBalances, transactionStatus, setTransactionStatus
    }}>
      {children}
    </Web3Context.Provider>
  );
};