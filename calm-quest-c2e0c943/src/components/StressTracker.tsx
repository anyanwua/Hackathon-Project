import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingDown, Award, Flame } from "lucide-react";
import { toast } from "sonner";
import { StressCircle } from "./StressCircle";
import { getUserData, calculateScore, submitCheckin, completeRecommendation, type UserData, type ScoreResult, type Recommendation } from "@/lib/api";

interface StressFactors {
  sleepHours: number;
  screenTimeHours: number;
  exerciseMinutes: number;
  waterIntakeLiters: number;
  meditationMinutes: number;
}

export const StressTracker = () => {
  const [factors, setFactors] = useState<StressFactors>({
    sleepHours: 7,
    screenTimeHours: 6,
    exerciseMinutes: 30,
    waterIntakeLiters: 2.5,
    meditationMinutes: 10,
  });

  const [userData, setUserData] = useState<UserData | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getUserData();
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load user data');
    }
  };

  const xpProgress = userData ? (userData.xp / userData.xpToNextLevel) * 100 : 0;

  // Generate insight summary based on stress level and recommendations
  const generateInsightSummary = (stressLevel: number, recommendations: Recommendation[]): string => {
    let summary = '';
    
    // Determine stress category
    if (stressLevel >= 70) {
      summary = `Your stress level is very high (${Math.round(stressLevel)}%). `;
      if (recommendations.length > 0) {
        const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
        if (highPriorityRecs.length > 0) {
          summary += `Focus on addressing ${highPriorityRecs.length === 1 ? 'the critical issue' : 'these critical issues'}: `;
          summary += highPriorityRecs.slice(0, 2).map(r => r.title.replace(/🚨|⚠️|Critical: /g, '').trim()).join(' and ');
          if (highPriorityRecs.length > 2) {
            summary += `, plus ${highPriorityRecs.length - 2} more critical ${highPriorityRecs.length - 2 === 1 ? 'area' : 'areas'}`;
          }
          summary += '.';
        } else {
          summary += `Address the ${recommendations.length === 1 ? 'recommendation' : `${recommendations.length} recommendations`} below to improve your wellness.`;
        }
      } else {
        summary += 'Consider making lifestyle adjustments to reduce stress.';
      }
    } else if (stressLevel >= 40) {
      summary = `Your stress level is moderate (${Math.round(stressLevel)}%). `;
      if (recommendations.length > 0) {
        summary += `You have ${recommendations.length} ${recommendations.length === 1 ? 'area' : 'areas'} to focus on: `;
        summary += recommendations.slice(0, 3).map(r => r.title.replace(/🚨|⚠️|Critical: /g, '').trim()).join(', ');
        if (recommendations.length > 3) {
          summary += `, and ${recommendations.length - 3} more`;
        }
        summary += '.';
      } else {
        summary += 'You\'re on the right track. Continue maintaining healthy habits.';
      }
    } else {
      summary = `Your stress level is low (${Math.round(stressLevel)}%). `;
      if (recommendations.length > 0) {
        summary += `You have ${recommendations.length} minor ${recommendations.length === 1 ? 'improvement' : 'improvements'} to consider: `;
        summary += recommendations.slice(0, 2).map(r => r.title.replace(/🚨|⚠️|Critical: /g, '').trim()).join(' and ');
        if (recommendations.length > 2) {
          summary += `, plus ${recommendations.length - 2} more`;
        }
        summary += '.';
      } else {
        summary += 'Excellent! Your lifestyle habits are well-balanced. Keep up the great work!';
      }
    }
    
    return summary;
  };

  const getStressColor = (level: number): string => {
    if (level < 30) return "success";
    if (level < 60) return "accent";
    return "destructive";
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Calculate score using linear regression model with direct inputs
      const score = await calculateScore(
        factors.sleepHours,
        factors.screenTimeHours,
        factors.exerciseMinutes,
        factors.waterIntakeLiters,
        factors.meditationMinutes
      );
      
      setScoreResult(score);
      setIsCalculated(true);
      
      // Submit check-in
      const checkinResponse = await submitCheckin(
        'default',
        factors.sleepHours,
        factors.screenTimeHours,
        factors.exerciseMinutes,
        factors.waterIntakeLiters,
        factors.meditationMinutes,
        score.score
      );
      
      // Update user data
      setUserData(checkinResponse.userData);
      
      // Filter out already completed recommendations after getting updated user data
      const completedIds = checkinResponse.userData.completedRecommendations || [];
      const availableRecommendations = (score.recommendations || []).filter(
        (rec) => !completedIds.includes(rec.id)
      );
      setRecommendations(availableRecommendations);
      
      // Debug: Log recommendations for troubleshooting
      console.log('Score recommendations:', score.recommendations?.length || 0);
      console.log('Completed IDs:', completedIds);
      console.log('Available recommendations:', availableRecommendations.length);
      
      // Show XP gains
      checkinResponse.xpGains.forEach((gain, index) => {
        setTimeout(() => {
          toast.success(`+${gain.amount} XP`, {
            description: gain.reason,
          });
        }, index * 500);
      });
      
      // Show level up
      if (checkinResponse.levelUp) {
        setTimeout(() => {
          toast.success("Level Up! 🎉", {
            description: `You've reached level ${checkinResponse.levelUp}!`,
            duration: 5000,
          });
        }, checkinResponse.xpGains.length * 500);
      }
      
      // Show badge unlocks
      if (checkinResponse.newBadges.length > 0) {
        setTimeout(() => {
          checkinResponse.newBadges.forEach((badgeId, index) => {
            setTimeout(() => {
              toast.success("Badge Unlocked! 🏅", {
                description: `You earned a new badge!`,
                duration: 5000,
              });
            }, index * 1000);
          });
        }, (checkinResponse.xpGains.length * 500) + 1000);
      }
      
      toast.success("Check-in submitted!", {
        description: `Your wellness analysis is complete!`,
      });
    } catch (error) {
      console.error('Failed to submit check-in:', error);
      toast.error('Failed to submit check-in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFactor = (key: keyof StressFactors, value: number[]) => {
    setFactors(prev => ({ ...prev, [key]: value[0] }));
    setIsCalculated(false);
    setScoreResult(null);
    setRecommendations([]); // Clear recommendations when inputs change
  };

  // Calculate stress level from score
  // In the new penalty-based system: score = penalty (0-100, higher = worse)
  // For stress visualization, we'll use the predicted stress level if available,
  // otherwise derive from score (higher penalty score = higher stress)
  const stressLevel = scoreResult?.predictedStressLevel !== undefined
    ? scoreResult.predictedStressLevel * 10  // Convert 0-10 to 0-100%
    : scoreResult
      ? scoreResult.score  // Use penalty score directly as stress indicator
      : 0;

  if (!userData) {
    return (
      <Card className="bg-gradient-card shadow-soft border-border/50">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card shadow-soft border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-accent" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{userData.currentStreak} days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-soft border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{userData.points}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-soft border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" />
              Level {userData.level}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold text-foreground">{userData.level}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{userData.xp} XP</span>
                <span>{userData.xpToNextLevel} XP</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isCalculated && scoreResult ? (
        <Card className="bg-gradient-card shadow-glow border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Stress Analysis
            </CardTitle>
            <CardDescription>Your stress level and insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center py-4">
              <StressCircle 
                factors={{
                  sleepHours: factors.sleepHours,
                  screenTimeHours: factors.screenTimeHours,
                  exerciseMinutes: factors.exerciseMinutes,
                  waterIntakeLiters: factors.waterIntakeLiters,
                  meditationMinutes: factors.meditationMinutes
                }} 
                stressLevel={stressLevel} 
              />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                <p className="text-sm text-muted-foreground mb-2">Your Persona:</p>
                <p className="font-semibold text-foreground mb-2">{scoreResult.persona}</p>
                <p className="text-sm text-muted-foreground">{scoreResult.personaDescription}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                <p className="text-sm text-muted-foreground mb-2">Insights:</p>
                <p className="text-sm text-foreground">
                  {isCalculated && scoreResult 
                    ? generateInsightSummary(stressLevel, recommendations)
                    : scoreResult?.message || 'Complete your check-in to see personalized insights.'}
                </p>
              </div>
              
              {/* Recommendations - Only show after user submits data */}
              {isCalculated && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                  <p className="text-sm font-semibold text-foreground mb-3">Recommended Tasks:</p>
                  {recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                          rec.priority === 'high'
                            ? 'bg-destructive/10 border-destructive/30 hover:bg-destructive/15'
                            : rec.priority === 'medium'
                            ? 'bg-accent/10 border-accent/30 hover:bg-accent/15'
                            : 'bg-background/50 border-border/20 hover:bg-background/70'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                            {rec.priority && (
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  rec.priority === 'high'
                                    ? 'bg-destructive/20 text-destructive'
                                    : rec.priority === 'medium'
                                    ? 'bg-accent/20 text-accent'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {rec.priority === 'high' ? 'High Priority' : rec.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                              </span>
                            )}
                            <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                              +{rec.xp} XP
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{rec.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const result = await completeRecommendation('default', rec.id);
                              setUserData(result.userData);
                              // Remove the completed recommendation from the list
                              setRecommendations(prev => prev.filter((r) => r.id !== rec.id));
                              toast.success(`+${result.xpGain.amount} XP - ${result.xpGain.reason}`);
                              if (result.levelUp) {
                                toast.success(`Level Up! You're now level ${result.levelUp}`);
                              }
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : 'Failed to complete recommendation');
                            }
                          }}
                          className="ml-3"
                        >
                          Complete
                        </Button>
                      </div>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        🎉 Great job! All your metrics are in the optimal range. Keep up the excellent work!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Button
              onClick={() => {
                setIsCalculated(false);
                setScoreResult(null);
                setRecommendations([]);
              }}
              variant="outline"
              className="w-full"
            >
              Adjust Factors
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-card shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Track Your Factors</CardTitle>
            <CardDescription>Adjust the sliders to reflect your day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span>💤</span>
                <span>Sleep Hours: {factors.sleepHours}h</span>
              </Label>
              <Slider
                value={[factors.sleepHours]}
                onValueChange={(val) => updateFactor("sleepHours", val)}
                min={0}
                max={12}
                step={0.5}
                className="cursor-pointer"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span>📱</span>
                <span>Screen Time Hours: {factors.screenTimeHours}h</span>
              </Label>
              <Slider
                value={[factors.screenTimeHours]}
                onValueChange={(val) => updateFactor("screenTimeHours", val)}
                min={0}
                max={16}
                step={0.5}
                className="cursor-pointer"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span>💪</span>
                <span>Exercise Minutes: {factors.exerciseMinutes}min</span>
              </Label>
              <Slider
                value={[factors.exerciseMinutes]}
                onValueChange={(val) => updateFactor("exerciseMinutes", val)}
                min={0}
                max={180}
                step={5}
                className="cursor-pointer"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span>💧</span>
                <span>Water Intake: {factors.waterIntakeLiters}L</span>
              </Label>
              <Slider
                value={[factors.waterIntakeLiters]}
                onValueChange={(val) => updateFactor("waterIntakeLiters", val)}
                min={0}
                max={5}
                step={0.1}
                className="cursor-pointer"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span>🧘</span>
                <span>Meditation Minutes: {factors.meditationMinutes}min</span>
              </Label>
              <Slider
                value={[factors.meditationMinutes]}
                onValueChange={(val) => updateFactor("meditationMinutes", val)}
                min={0}
                max={60}
                step={1}
                className="cursor-pointer"
                disabled={isLoading}
              />
            </div>

            <Button 
              onClick={handleSubmit}
              className="w-full bg-gradient-hero shadow-glow hover:shadow-accent transition-all"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Calculating..." : "Calculate Score"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
