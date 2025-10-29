import { motion } from 'framer-motion';
import './Chip.css';

interface ChipProps {
  value: number;
  onClick?: () => void;
  index?: number;
}

const chipColors: Record<number, { bg: string; border: string }> = {
  10: { bg: '#dc2626', border: '#991b1b' },
  20: { bg: '#2563eb', border: '#1e40af' },
  50: { bg: '#16a34a', border: '#15803d' },
  100: { bg: '#eab308', border: '#a16207' },
  500: { bg: '#9333ea', border: '#6b21a8' },
  1000: { bg: '#ea580c', border: '#c2410c' },
};

function Chip({ value, onClick, index = 0 }: ChipProps) {
  const colors = chipColors[value] || chipColors[10];

  return (
    <motion.button
      className="chip"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${colors.bg}, ${colors.border})`,
        borderColor: colors.border,
      }}
      onClick={onClick}
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        type: "spring",
        stiffness: 200,
      }}
      whileHover={{
        scale: 1.2,
        y: -8,
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.3 },
      }}
      whileTap={{
        scale: 0.9,
        rotate: 10,
      }}
    >
      <motion.div
        className="chip-inner"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        <span className="chip-value">${value}</span>
      </motion.div>
    </motion.button>
  );
}

export default Chip;
