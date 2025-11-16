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
      
      // Filter out already completed recommendations
      const completedIds = userData?.completedRecommendations || [];
      const availableRecommendations = (score.recommendations || []).filter(
        (rec) => !completedIds.includes(rec.id)
      );
      setRecommendations(availableRecommendations);
      
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
        description: `Biological Impact Score: ${score.score}/100 - ${score.category}`,
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
  };

  // Calculate stress level from score
  // Score = 100 - (predictedStressLevel * 10), so stressLevel = 100 - score
  // This is more reliable than using predictedStressLevel directly
  const stressLevel = scoreResult ? 100 - scoreResult.score : 0;

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
              Biological Impact Analysis
            </CardTitle>
            <CardDescription>Your wellness score and insights</CardDescription>
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
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground mb-2">
                  Score: {scoreResult.score}/100
                </p>
                <p className={`text-lg font-semibold ${
                  scoreResult.category === 'High' ? 'text-success' :
                  scoreResult.category === 'Moderate' ? 'text-accent' :
                  'text-destructive'
                }`}>
                  {scoreResult.category} Impact
                </p>
                {scoreResult.predictedStressLevel !== undefined && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Predicted Stress Level: {scoreResult.predictedStressLevel}/10
                  </p>
                )}
              </div>
              
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                <p className="text-sm text-muted-foreground mb-2">Your Persona:</p>
                <p className="font-semibold text-foreground mb-2">{scoreResult.persona}</p>
                <p className="text-sm text-muted-foreground">{scoreResult.personaDescription}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                <p className="text-sm text-muted-foreground mb-2">Insights:</p>
                <p className="text-sm text-foreground">{scoreResult.message}</p>
              </div>
              
              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="p-4 rounded-lg bg-secondary/50 border border-border/30">
                  <p className="text-sm font-semibold text-foreground mb-3">Recommended Tasks:</p>
                  <div className="space-y-2">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-start justify-between p-3 rounded-lg bg-background/50 border border-border/20 hover:bg-background/70 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-foreground">{rec.title}</p>
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
                              setRecommendations(recommendations.filter((r) => r.id !== rec.id));
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
                </div>
              )}
            </div>
            
            <Button
              onClick={() => {
                setIsCalculated(false);
                setScoreResult(null);
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
