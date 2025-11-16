import { useState, useEffect } from "react";

interface StressCircleProps {
  factors: {
    sleep: number;
    workload: number;
    exercise: number;
    social: number;
    nutrition: number;
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
  const getFactorScore = (key: keyof typeof factors): number => {
    if (key === 'sleep') {
      return ((10 - Math.abs(7.5 - factors.sleep)) / 10) * 100;
    }
    if (key === 'workload') {
      return ((10 - factors.workload) / 10) * 100;
    }
    return (factors[key] / 10) * 100;
  };

  const getColor = (score: number): string => {
    if (score >= 70) return 'hsl(var(--success))';
    if (score >= 40) return 'hsl(var(--accent))';
    return 'hsl(var(--destructive))';
  };

  const rings = [
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
                  stroke={getColor(score)}
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
        
        {/* Center content */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
          stage >= 1 ? 'scale-100 opacity-100' : 'scale-150 opacity-100'
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
                style={{ backgroundColor: getColor(score) }}
              />
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">{ring.label}</p>
                <p className="text-xs text-muted-foreground">{Math.round(score)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
