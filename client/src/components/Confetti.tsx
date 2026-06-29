import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { winnerVariants } from '../animations/variants';

interface ConfettiProps {
  active: boolean;
}

/** Confetti celebration on win */
export function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#f472b6'];
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 3 + 2,
      angle: Math.random() * Math.PI * 2,
      spin: Math.random() * 0.2,
    }));

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speed;
        p.x += Math.sin(p.angle) * 2;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });
      frame = requestAnimationFrame(animate);
    };
    animate();

    const timeout = setTimeout(() => cancelAnimationFrame(frame), 5000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [active]);

  if (!active) return null;

  return (
  <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}

interface WinnerOverlayProps {
  winnerName: string;
  isWinner: boolean;
  onNextRound?: () => void;
  onHome: () => void;
}

export function WinnerOverlay({ winnerName, isWinner, onNextRound, onHome }: WinnerOverlayProps) {
  return (
    <>
      <Confetti active={isWinner} />
      <motion.div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="glass p-8 max-w-md mx-4 text-center"
          variants={winnerVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-4xl font-display font-bold mb-2">
            {isWinner ? '🎉 You Win!' : 'Round Over'}
          </h2>
          <p className="text-xl text-slate-300 mb-6">
            {isWinner ? 'Congratulations!' : `${winnerName} wins this round!`}
          </p>
          <div className="flex flex-col gap-3">
            {onNextRound && (
              <button type="button" className="btn-primary" onClick={onNextRound}>
                Next Round
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onHome}>
              Back to Home
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
