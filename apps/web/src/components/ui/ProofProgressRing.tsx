'use client';

import { motion } from 'framer-motion';

export interface ProofProgressRingProps {
  progress: number; // 0 to 100
  stage: string;
  size?: number;
  strokeWidth?: number;
}

export function ProofProgressRing({
  progress,
  stage,
  size = 180,
  strokeWidth = 10,
}: ProofProgressRingProps) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer Glow Circle */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress stroke */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#06B6D4" // cyan
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <motion.span
            key={progress}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-display font-extrabold text-white"
          >
            {Math.round(progress)}%
          </motion.span>
          <span className="text-[11px] font-mono text-cyan uppercase tracking-wider font-semibold mt-1">
            ZK Groth16
          </span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <div className="text-sm font-medium text-gray-200">{stage}</div>
        <div className="text-xs font-mono text-gray-400">
          Private inputs never leave your browser
        </div>
      </div>
    </div>
  );
}
