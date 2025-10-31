// src/components/Stepper.tsx
import React, { useState, useEffect } from "react";

type Step = { key: number; label: string };

interface StepperProps {
  currentStep: number;              // 1-based index of the active step
  steps?: Step[];                   // optional; defaults to 3 steps
  className?: string;
  compact?: boolean;                // New: force compact mode
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  steps,
  className = "",
  compact = false
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Default to 3 steps if none provided
  const defaultSteps: Step[] = [
    { key: 1, label: "Detalji" },
    { key: 2, label: "Fotografije" },
    { key: 3, label: "Pregled" },
  ];

  const items = Array.isArray(steps) && steps.length > 0 ? steps : defaultSteps;
  const active = Math.min(Math.max(Number(currentStep) || 1, 1), items.length);
  const showCompact = compact || isMobile;

  if (showCompact) {
    // Mobile: Compact Sticky Pill
    return (
      <div className={`stepper-compact ${className}`}>
        <div className="stepper-compact-inner">
          {items.map((step, idx) => {
            const isDone = step.key < active;
            const isActive = step.key === active;

            return (
              <React.Fragment key={step.key}>
                <div
                  className={[
                    "stepper-compact-circle",
                    isDone ? "done" : isActive ? "active" : "pending"
                  ].join(" ")}
                  aria-label={step.label}
                  title={step.label}
                >
                  {isDone ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-semibold">{step.key}</span>
                  )}
                </div>
                {idx < items.length - 1 && <div className="stepper-compact-connector" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: Full Stepper
  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      {items.map((step, idx) => {
        const isDone = step.key < active;
        const isActive = step.key === active;
        const isLast = idx === items.length - 1;

        return (
          <div key={step.key} className="flex items-center">
            {/* Stepped Pill */}
            <div className="flex items-center">
              <div
                className={[
                  "flex items-center justify-center w-12 h-12 rounded-full text-sm font-semibold transition-all duration-200 border-2",
                  isDone ? "gradient-primary text-white border-transparent shadow-lg stepper-pill-done" :
                  isActive ? "gradient-border bg-surface text-primary border-transparent shadow-md" :
                  "bg-surface text-muted-foreground border-border"
                ].join(" ")}
              >
                {isDone ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.key
                )}
              </div>

              {/* Label */}
              <div className="ml-3 text-sm">
                <div className={[
                  "transition-all duration-200",
                  isActive ? "font-semibold text-primary" :
                  isDone ? "font-medium text-foreground" :
                  "text-muted-foreground"
                ].join(" ")}>
                  {step.label}
                </div>
              </div>
            </div>

            {/* Progress Line */}
            {!isLast && (
              <div className="mx-6 relative">
                <div className="w-16 h-[2px] bg-border rounded-full"></div>
                <div
                  className={[
                    "absolute top-0 left-0 h-[2px] rounded-full transition-all duration-300 ease-out",
                    isDone ? "w-full gradient-primary progress-line-shimmer" :
                    isActive ? "w-8 gradient-primary opacity-60" :
                    "w-0"
                  ].join(" ")}
                ></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
