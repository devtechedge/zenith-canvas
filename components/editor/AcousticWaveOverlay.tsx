'use client';

import { useEffect, useRef } from 'react';

export default function AcousticWaveOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ResizeObserver to track container resizing accurately
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      
      ctx.strokeStyle = '#2D6A4F';
      ctx.lineWidth = 1.5;

      // Draw multiple layers of soft wavy ribbons
      for (let layer = 0; layer < 4; layer++) {
        ctx.beginPath();
        const layerPhase = phase + layer * (Math.PI / 4);
        const layerAmplitude = 15 + layer * 8;
        const speedMultiplier = 1 - layer * 0.15;

        for (let x = 0; x < width; x += 5) {
          // Double sine-wave interference pattern
          const y = (height / 2) + 
            Math.sin(x * 0.005 * speedMultiplier + layerPhase) * layerAmplitude + 
            Math.cos(x * 0.012 + layerPhase * 1.5) * (layerAmplitude * 0.4);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      phase += 0.015;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06] z-0 transition-opacity duration-500"
    />
  );
}
