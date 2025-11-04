import { MeshGradient } from "@paper-design/shaders-react";
import type React from "react";

interface ShaderBackgroundProps {
  children: React.ReactNode;
}

export function ShaderBackground({ children }: ShaderBackgroundProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background Shaders - Reel Estate Brand Colors */}
      <MeshGradient
        className="absolute inset-0 w-full h-full"
        colors={["#000000", "#3B5BFF", "#3B82F6", "#2DD4BF", "#1E40AF"]}
        speed={0.3}
        backgroundColor="#000000"
      />
      <MeshGradient
        className="absolute inset-0 w-full h-full opacity-40"
        colors={["#000000", "#3B5BFF", "#2DD4BF", "#000000"]}
        speed={0.2}
        wireframe="true"
        backgroundColor="transparent"
      />

      {children}
    </div>
  );
}
