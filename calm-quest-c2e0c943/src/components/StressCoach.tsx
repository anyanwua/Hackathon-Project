import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Heart, Brain, Activity } from "lucide-react";

interface Recommendation {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export const StressCoach = () => {
  const recommendations: Recommendation[] = [
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Prioritize Sleep",
      description: "Aim for 7-8 hours tonight. Your sleep impacts everything from mood to decision-making.",
      color: "text-primary",
    },
    {
      icon: <Activity className="h-5 w-5" />,
      title: "Move Your Body",
      description: "Even a 10-minute walk can reduce stress hormones and boost endorphins.",
      color: "text-accent",
    },
    {
      icon: <Brain className="h-5 w-5" />,
      title: "Practice Mindfulness",
      description: "Try 5 minutes of deep breathing or meditation to reset your nervous system.",
      color: "text-success",
    },
  ];

  return (
    <Card className="bg-gradient-card shadow-soft border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          Your Stress Coach
        </CardTitle>
        <CardDescription>Personalized recommendations for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, idx) => (
          <div 
            key={idx}
            className="flex gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-smooth border border-border/30"
          >
            <div className={`${rec.color} flex-shrink-0 mt-1`}>
              {rec.icon}
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">{rec.title}</h4>
              <p className="text-sm text-muted-foreground">{rec.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
