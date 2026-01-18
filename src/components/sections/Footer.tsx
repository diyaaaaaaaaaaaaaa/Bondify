import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export const Footer = () => (
  <footer className="py-12 px-6 border-t border-border">
    <div className="max-w-4xl mx-auto">
      <motion.div className="bg-muted/50 border border-border rounded-xl p-6 mb-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Disclaimer:</span> This is a hackathon prototype using simulated government bonds for demonstration purposes. No real financial transactions or investments are made through this platform.
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold rounded-xl"><img src="/Bondify_Logo.png" className='rounded-xl'/></span>
          </div>
          <span className="font-bold uppercase">Bondify</span>
        </div>
        <p className="text-sm text-muted-foreground">Built for East-India Blockchain Summit (EIBS) 2.0</p>
        <p className="text-xs text-muted-foreground">© 2026 Bondify. Hackathon Project.</p>
      </div>
    </div>
  </footer>
);
