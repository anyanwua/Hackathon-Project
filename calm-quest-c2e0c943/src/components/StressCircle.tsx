import { useState, useEffect } from "react";

interface StressCircleProps {
  factors: {
    sleepHours?: number;
    screenTimeHours?: number;
    exerciseMinutes?: number;
    waterIntakeLiters?: number;
    meditationMinutes?: number;
    // Legacy support
    sleep?: number;
    workload?: number;
    exercise?: number;
    social?: number;
    nutrition?: number;
  };
  stressLevel: number;
}

export const StressCircle = ({ factors, stressLevel }: StressCircleProps) => {
  const [stage, setStage] = useState(0); // 0: center only, 1: slide to side, 2: show rings

  useEffect(() => {
    // Stage 0: Show center for 800ms
    const timer1 = setTimeout(() => setStage(1), 800);
    // Stage 1: Slide to side for 600ms
    const timer2 = setTimeout(() => setStage(2), 1400);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);
  const getFactorScore = (key: string): number => {
    // New metrics
    if (key === 'sleep' && factors.sleepHours !== undefined) {
      return ((10 - Math.abs(8 - factors.sleepHours)) / 10) * 100;
    }
    if (key === 'screen' && factors.screenTimeHours !== undefined) {
      // Lower screen time is better (ideal <= 4h)
      // If 4 hours or less, return 100 (perfect)
      if (factors.screenTimeHours <= 4) {
        return 100;
      }
      // For values > 4 hours, scale down from 100
      return Math.max(0, ((10 - (factors.screenTimeHours - 4)) / 10) * 100);
    }
    if (key === 'exercise' && factors.exerciseMinutes !== undefined) {
      // More exercise is better (ideal >= 30min)
      return Math.min(100, (factors.exerciseMinutes / 30) * 100);
    }
    if (key === 'water' && factors.waterIntakeLiters !== undefined) {
      // Ideal 2-3L
      const ideal = 2.5;
      const deviation = Math.abs(ideal - factors.waterIntakeLiters) * 2;
      return Math.max(0, ((10 - deviation) / 10) * 100);
    }
    if (key === 'meditation' && factors.meditationMinutes !== undefined) {
      // More meditation is better (ideal >= 10min)
      return Math.min(100, (factors.meditationMinutes / 10) * 100);
    }
    // Legacy support
    if (key === 'sleep' && factors.sleep !== undefined) {
      return ((10 - Math.abs(7.5 - factors.sleep)) / 10) * 100;
    }
    if (key === 'workload' && factors.workload !== undefined) {
      return ((10 - factors.workload) / 10) * 100;
    }
    if (key === 'exercise' && factors.exercise !== undefined) {
      return (factors.exercise / 10) * 100;
    }
    if (key === 'social' && factors.social !== undefined) {
      return (factors.social / 10) * 100;
    }
    if (key === 'nutrition' && factors.nutrition !== undefined) {
      return (factors.nutrition / 10) * 100;
    }
    return 0;
  };

  // Get distinct color for each factor
  const getFactorColor = (factorKey: string): string => {
    const colorMap: Record<string, string> = {
      'sleep': '#6366f1',      // Indigo
      'screen': '#f59e0b',     // Amber/Orange
      'exercise': '#10b981',   // Green
      'water': '#06b6d4',      // Cyan
      'meditation': '#ec4899', // Pink/Magenta
      // Legacy support
      'workload': '#ef4444',   // Red
      'social': '#3b82f6',     // Blue
      'nutrition': '#f97316',  // Orange
    };
    return colorMap[factorKey] || 'hsl(var(--muted))';
  };

  // Keep score-based color for opacity/brightness variation if needed
  const getColor = (score: number): string => {
    if (score >= 70) return 'hsl(var(--success))';
    if (score >= 40) return 'hsl(var(--accent))';
    return 'hsl(var(--destructive))';
  };

  // Use new metrics if available, otherwise fall back to legacy
  const useNewMetrics = factors.sleepHours !== undefined || factors.screenTimeHours !== undefined;
  
  const rings = useNewMetrics ? [
    { key: 'sleep', label: 'Sleep', radius: 140 },
    { key: 'screen', label: 'Screentime', radius: 115 },
    { key: 'exercise', label: 'Exercise', radius: 90 },
    { key: 'water', label: 'Water', radius: 65 },
    { key: 'meditation', label: 'Meditation', radius: 40 },
  ] : [
    { key: 'sleep', label: 'Sleep', radius: 140 },
    { key: 'workload', label: 'Work', radius: 115 },
    { key: 'exercise', label: 'Exercise', radius: 90 },
    { key: 'social', label: 'Social', radius: 65 },
    { key: 'nutrition', label: 'Nutrition', radius: 40 },
  ] as const;

  const getStressColor = (): string => {
    if (stressLevel < 30) return 'text-success';
    if (stressLevel < 60) return 'text-accent';
    return 'text-destructive';
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-6">
        <div 
          className={`relative w-80 h-80 flex items-center justify-center transition-all duration-700 ${
            stage >= 1 ? 'scale-100' : 'scale-125'
          }`}
          style={{
            transform: stage >= 1 ? 'translateX(0)' : 'translateX(0) scale(1.25)',
          }}
        >
          <svg width="320" height="320" className="transform -rotate-90">
            {rings.map((ring, index) => {
              const score = getFactorScore(ring.key);
              const circumference = 2 * Math.PI * ring.radius;
              const strokeDashoffset = circumference - (score / 100) * circumference;
              const ringDelay = (4 - index) * 150; // Inner rings animate first
              
              return (
                <g key={ring.key}>
                  {/* Background circle */}
                  <circle
                    cx="160"
                    cy="160"
                    r={ring.radius}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="12"
                    opacity={stage >= 2 ? "0.2" : "0"}
                    className="transition-opacity duration-500"
                    style={{
                      transitionDelay: stage >= 2 ? `${ringDelay}ms` : '0ms'
                    }}
                  />
                  {/* Progress circle */}
                  <circle
                    cx="160"
                    cy="160"
                    r={ring.radius}
                    fill="none"
                    stroke={getFactorColor(ring.key)}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={stage >= 2 ? strokeDashoffset : circumference}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                    style={{
                      transitionDelay: stage >= 2 ? `${ringDelay}ms` : '0ms'
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Stress Level Label - Side */}
        <div className={`flex flex-col justify-center transition-all duration-500 ${
          stage >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        }`}>
          <p className="text-sm text-muted-foreground mb-1">Stress Level</p>
          <p className={`text-5xl font-bold ${getStressColor()}`}>
            {Math.round(stressLevel)}%
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-md transition-all duration-500 ${
        stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        {rings.map((ring, index) => {
          const score = getFactorScore(ring.key);
          return (
            <div 
              key={ring.key} 
              className="flex items-center gap-2 transition-all duration-500"
              style={{
                transitionDelay: stage >= 2 ? `${(4 - index) * 150 + 300}ms` : '0ms'
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getFactorColor(ring.key) }}
              />
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">{ring.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
