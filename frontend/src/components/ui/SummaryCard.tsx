import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  index: number;
  prefix?: string;
  suffix?: string;
  children?: ReactNode;
}

export const SummaryCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = 'text-primary',
  index,
  prefix = '',
  suffix = '',
  children,
}: SummaryCardProps) => {
  return (
    <motion.div
      className="relative bg-card border border-border rounded-2xl p-6 overflow-hidden group"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        borderColor: 'hsl(var(--primary) / 0.3)',
      }}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-muted ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          {subtitle && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {subtitle}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {title}
        </p>
        
        <motion.p 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
        >
          {prefix}
          <span className="text-primary">{typeof value === 'number' ? value.toLocaleString() : value}</span>
          {suffix && <span className="text-lg text-muted-foreground ml-1">{suffix}</span>}
        </motion.p>

        {children}
      </div>
    </motion.div>
  );
};
