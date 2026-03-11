"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { motion } from "framer-motion";

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 1000,
      height: 1000,
      phi: 0,
      theta: 0.2,
      dark: 1,
      diffuse: 1.2,
      scale: 1,
      mapSamples: 16000,
      mapBrightness: 8,
      baseColor: [0.08, 0.11, 0.18],  // Match #151C2F roughly
      markerColor: [0.24, 0.36, 1],   // Match #3D5CFF
      glowColor: [0.04, 0.05, 0.08],  // Match #0B0E14 roughly
      markers: [
        { location: [37.7595, -122.4367], size: 0.05 },
        { location: [40.7128, -74.006], size: 0.05 },
        { location: [51.5074, -0.1278], size: 0.05 },
        { location: [35.6895, 139.6917], size: 0.05 },
        { location: [-33.8688, 151.2093], size: 0.05 },
        { location: [19.0760, 72.8777], size: 0.05 },
      ],
      onRender: (state: any) => {
        state.phi = phi;
        phi += 0.003;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className={`relative w-full aspect-square flex items-center justify-center ${className || ""}`}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          contain: "layout paint size",
          opacity: 0.9,
          cursor: "grab",
        }}
      />
    </motion.div>
  );
};
