import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingDown, Award, Flame } from "lucide-react";
import { toast } from "sonner";
import { StressCircle } from "./StressCircle";
import { getUserData, calculateScore, submitCheckin, mapFactorsToScoring, type UserData, type ScoreResult } from "@/lib/api";

interface StressFactors {
  sleep: number;
  workload: number;
  exercise: number;
  social: number;
  nutrition: number;
}

export const StressTracker = () => {
  const [factors, setFactors] = useState<StressFactors>({
    sleep: 7,
    workload: 5,
    exercise: 3,
    social: 5,
    nutrition: 5,
  });

  const [userData, setUserData] = useState<UserData | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  // Calculate stress level from score (inverse of biological impact score)
  const stressLevel = scoreResult ? 100 - scoreResult.score : 0;

  const getStressColor = (level: number): string => {
    if (level < 30) return "success";
    if (level < 60) return "accent";
    return "destructive";
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Map factors to linear regression model inputs
      const scoringInputs = mapFactorsToScoring(factors);
      
      // Calculate score using linear regression model
      const score = await calculateScore(
        scoringInputs.sleepHours,
        scoringInputs.screenTimeHours,
        scoringInputs.exerciseMinutes,
        scoringInputs.waterIntakeLiters,
        scoringInputs.meditationMinutes
      );
      
      setScoreResult(score);
      setIsCalculated(true);
      
      // Submit check-in
      const checkinResponse = await submitCheckin(
        'default',
        scoringInputs.sleepHours,
        scoringInputs.screenTimeHours,
        scoringInputs.exerciseMinutes,
        scoringInputs.waterIntakeLiters,
        scoringInputs.meditationMinutes,
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
              <StressCircle factors={factors} stressLevel={stressLevel} />
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
              <Label className="text-sm font-medium">Sleep (hours): {factors.sleep}h</Label>
              <Slider
                value={[factors.sleep]}
                onValueChange={(val) => updateFactor("sleep", val)}
                min={0}
                max={12}
                step={0.5}
                className="cursor-pointer"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Work Stress: {factors.workload}/10</Label>
              <Slider
                value={[factors.workload]}
                onValueChange={(val) => updateFactor("workload", val)}
                min={0}
                max={10}
                step={1}
                className="cursor-pointer"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Exercise: {factors.exercise}/10</Label>
              <Slider
                value={[factors.exercise]}
                onValueChange={(val) => updateFactor("exercise", val)}
                min={0}
                max={10}
                step={1}
                className="cursor-pointer"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Social Connection: {factors.social}/10</Label>
              <Slider
                value={[factors.social]}
                onValueChange={(val) => updateFactor("social", val)}
                min={0}
                max={10}
                step={1}
                className="cursor-pointer"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Nutrition Quality: {factors.nutrition}/10</Label>
              <Slider
                value={[factors.nutrition]}
                onValueChange={(val) => updateFactor("nutrition", val)}
                min={0}
                max={10}
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
