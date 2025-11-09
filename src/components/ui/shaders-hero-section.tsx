import type React from "react";

interface ShaderBackgroundProps {
  children: React.ReactNode;
}

export function ShaderBackground({ children }: ShaderBackgroundProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Animated gradient overlay - CSS only, no WebGL */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3B5BFF]/20 via-transparent to-[#2DD4BF]/20 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3B5BFF]/10 via-transparent to-transparent" />

      {children}
    </div>
  );
}
