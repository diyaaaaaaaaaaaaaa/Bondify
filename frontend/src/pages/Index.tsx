import { BondProvider } from '@/context/BondContext';
import { CustomCursor } from '@/components/layout/CustomCursor';
import { FuturisticBackground } from '@/components/ui/FuturisticBackground';
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/sections/Hero';
import { BondMarketplace } from '@/components/sections/BondMarketplace';
import { Portfolio } from '@/components/sections/Portfolio';
import { Redeem } from '@/components/sections/Redeem';
import { TransactionHistory } from '@/components/sections/TransactionHistory';
import { Footer } from '@/components/sections/Footer';

const Index = () => {
  return (
    <BondProvider>
      <div className="min-h-screen text-foreground relative">
        <FuturisticBackground />
        <CustomCursor />
        <Navbar />
        <main>
          <Hero />
          <BondMarketplace />
          <Portfolio />
          <Redeem />
          <TransactionHistory />
        </main>
        <Footer />
      </div>
    </BondProvider>
  );
};

export default Index;
