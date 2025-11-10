import type React from "react";

interface ShaderBackgroundProps {
  children: React.ReactNode;
}

export function ShaderBackground({ children }: ShaderBackgroundProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Animated gradient overlays - multiple layers for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3B5BFF]/30 via-transparent to-[#2DD4BF]/30 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3B5BFF]/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#2DD4BF]/15 via-transparent to-transparent animate-gradient" style={{ animationDelay: '2s' }} />

      {/* Moving gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3B5BFF]/20 rounded-full blur-3xl animate-gradient" style={{ animationDuration: '12s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#2DD4BF]/20 rounded-full blur-3xl animate-gradient" style={{ animationDuration: '15s', animationDelay: '3s' }} />

      {children}
    </div>
  );
}
