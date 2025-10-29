import { motion } from 'framer-motion';
import { buttonPressVariants } from '../utils/animations';
import './AnimatedButton.css';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'gold' | 'danger' | 'success';
  disabled?: boolean;
  className?: string;
}

function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}: AnimatedButtonProps) {
  return (
    <motion.button
      className={`animated-button animated-button-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      variants={buttonPressVariants}
      initial="idle"
      whileHover={!disabled ? "hover" : undefined}
      whileTap={!disabled ? "tap" : undefined}
    >
      <motion.span
        className="button-content"
        initial={{ opacity: 1 }}
        whileTap={{ opacity: 0.8 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}

export default AnimatedButton;
