import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';

// --- CONFIGURATION ---
const FUJI_CHAIN_ID = '0xa869'; // 43113

// 👇 YOUR DEPLOYED ADDRESSES 👇
const EINR_ADDRESS = '0xA8309342b3918432eB9e4CF7ed5F274DDcf72930'; 
const TREASURY_ADDRESS = '0xa3F0c249358b5060B9Be971645e57E487E36601a'; 

const EINR_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isVerified: boolean;
  bondBalance: string;
  currencyBalance: string; // Real eINR
  claimableYield: string;
  yieldRate: string;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  switchToFuji: () => Promise<void>;
  handleMint: (amount: string) => Promise<void>;
  handleClaim: () => Promise<void>;
  compoundYield: (bondId: string, amount: number) => Promise<void>;
  redeemTokens: (amount: string, bondId: string, bondName: string) => Promise<boolean>;
  cancelSIP: (bondId: string) => Promise<void>;
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
  
  // Bond Balance (Off-Chain Asset)
  const [bondBalance, setBondBalance] = useState(() => localStorage.getItem('sim_bondBalance') || '0');
  
  // Currency Balance (Real On-Chain eINR)
  const [currencyBalance, setCurrencyBalance] = useState('0.00');
  
  const [claimableYield, setClaimableYield] = useState('0');
  const [yieldRate, setYieldRate] = useState('7.25');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');

  // Persist Bond Balance
  useEffect(() => {
    localStorage.setItem('sim_bondBalance', bondBalance);
  }, [bondBalance]);

  // --- HELPER: READ REAL BALANCE ---
  const refreshBalances = async () => {
    if (!account || !window.ethereum) return;
    try {
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(EINR_ADDRESS, EINR_ABI, provider);
        
        const rawBalance = await contract.balanceOf(account);
        const decimals = await contract.decimals(); 
        
        // Format to readable string (e.g. "500.00")
        const formatted = parseFloat(formatUnits(rawBalance, decimals)).toFixed(2);
        setCurrencyBalance(formatted);
        console.log("Updated Real Balance:", formatted);
    } catch (error) {
        console.error("Failed to fetch eINR balance:", error);
    }
  };

  useEffect(() => {
    if (isConnected && account) refreshBalances();
  }, [isConnected, account]);


  // --- BACKGROUND SIP WORKER (Hybrid Mode) ---
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
        if (bond.isSIP && bond.sipNextDate && now >= bond.sipNextDate) {
          const sipAmountRupees = bond.sipAmount || 100; 
          
          // NOTE: Checking UI balance for SIP check
          const currentBalance = parseFloat(currencyBalance);

          if (currentBalance >= sipAmountRupees) {
            const tokensToBuy = sipAmountRupees / 100; 

            const autoPurchase = {
              id: bond.id,
              name: `${bond.name} (SIP)`,
              amount: tokensToBuy,
              timestamp: now,
              isSIP: true,
              sipAmount: sipAmountRupees,
              sipNextDate: now + 120000
            };

            bond.sipNextDate = null; 
            newEntries.push(autoPurchase);
            
            // Optimistic UI Update
            setCurrencyBalance(prev => (parseFloat(prev) - sipAmountRupees).toFixed(2));
            setBondBalance(prev => (parseFloat(prev) + tokensToBuy).toString());
            updated = true;
          }
        }
      });

      if (updated) {
        localStorage.setItem('bond_holdings', JSON.stringify([...history, ...newEntries]));
      }
    }, 5000); 

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
        
        // Fetch Real Balance Immediately
        setTimeout(refreshBalances, 500);
      }
    } catch (e) { console.error(e); setTransactionStatus(''); }
  };

  // --- CORE FUNCTION: REAL BUY (Hybrid) ---
 // --- CORE FUNCTION: REAL BUY (Hybrid) ---
  const handleMint = async (amount: string) => {
    if (!isConnected) { alert('Connect Wallet'); return; }
    
    try {
      setTransactionStatus('INITIATING TRANSFER...');

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(EINR_ADDRESS, EINR_ABI, signer);

      // 1. TRIGGER METAMASK
      const tx = await contract.transfer(TREASURY_ADDRESS, parseUnits(amount, 18));
      
      setTransactionStatus('PROCESSING ON-CHAIN...');
      await tx.wait(); // Wait for confirmation

      setTransactionStatus('MINTING BOND...');
      await new Promise(r => setTimeout(r, 1000)); 
      
      // 2. OPTIMISTIC UPDATE (The Fix)
      // Manually update the UI state immediately, don't wait for the slow RPC
      setCurrencyBalance((prev) => {
          const newVal = parseFloat(prev) - parseFloat(amount);
          return newVal.toFixed(2);
      });

      setBondBalance((prev) => (parseFloat(prev) + parseFloat(amount) / 100).toString());
      
      setTransactionStatus('SUCCESS!');

      // 3. Background Refresh (Double Check)
      // We still ask the blockchain for the truth, but we do it after a delay
      // so the RPC has time to index the block.
      setTimeout(() => {
          refreshBalances();
      }, 5000); 

    } catch (error: any) {
      console.error(error);
      setTransactionStatus('PAYMENT FAILED');
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

  const compoundYield = async (bondId: string, amount: number) => {
    setTransactionStatus('COMPOUNDING...');
    try {
      await new Promise(r => setTimeout(r, 1500));
      const newTokens = amount / 100;
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

  const cancelSIP = async (bondId: string) => {
    setTransactionStatus('CANCELLING SIP...');
    try {
        await new Promise(r => setTimeout(r, 1000));
        
        const stored = localStorage.getItem('bond_holdings');
        if (stored) {
            const history = JSON.parse(stored);
            const updatedHistory = history.map((h: any) => {
                if (h.id === bondId) {
                    return { ...h, isSIP: false, sipNextDate: null };
                }
                return h;
            });
            localStorage.setItem('bond_holdings', JSON.stringify(updatedHistory));
            setBondBalance(prev => prev); 
        }
        setTransactionStatus('SIP STOPPED');
    } catch (e) {
        console.error(e);
        setTransactionStatus('ERROR');
    }
    setTimeout(() => setTransactionStatus(''), 2000);
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accs: string[]) => {
        if (accs.length) {
            setAccount(accs[0]);
            refreshBalances();
        } else {
            setIsConnected(false);
            setAccount(null);
        }
      });
    }
  }, []);

  return (
    <Web3Context.Provider value={{
      account, isConnected, isVerified, bondBalance, currencyBalance,
      claimableYield, yieldRate, isCorrectNetwork,
      connectWallet, switchToFuji, handleMint, handleClaim, 
      compoundYield, redeemTokens, cancelSIP,
      refreshBalances, transactionStatus, setTransactionStatus
    }}>
      {children}
    </Web3Context.Provider>
  );
};