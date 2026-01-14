import { motion } from 'framer-motion';
import { Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBondContext } from '@/context/BondContext';

export const Navbar = () => {
  const { wallet } = useBondContext();

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background/95 backdrop-blur-md border-b border-border/50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">B</span>
          </div>
          <span className="text-xl font-bold uppercase tracking-tight">
            Bond<span className="text-primary">ify</span>
          </span>
        </motion.div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
            Marketplace
          </a>
          <a href="#portfolio" className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
            Portfolio
          </a>
          <a href="#redeem" className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
            Redeem
          </a>
          <a href="#history" className="text-sm text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
            History
          </a>
        </div>

        {/* Wallet Button */}
        {wallet.isConnected ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className="text-sm font-mono text-primary">
                ${wallet.usdcBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
              </span>
            </div>
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border"
              whileHover={{ borderColor: 'hsl(var(--primary) / 0.5)' }}
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-mono">{wallet.shortAddress}</span>
              <button 
                onClick={wallet.disconnect}
                className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        ) : (
          <Button
            className="btn-connect glow-green"
            onClick={wallet.connect}
            disabled={wallet.isConnecting}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        )}
      </div>
    </motion.nav>
  );
};
