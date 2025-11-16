import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, TrendingUp, Target } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-wellness.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div 
        className="relative overflow-hidden bg-gradient-hero"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(21, 128, 128, 0.9), rgba(64, 184, 184, 0.8)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Master Your Stress,
              <br />
              Level Up Your Life
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Track your wellness factors, get AI-powered insights, and build healthy habits with our gamified stress management platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg"
                asChild
              >
                <Link to="/dashboard">
                  Start Tracking <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4 p-6 rounded-2xl bg-gradient-card shadow-soft hover:shadow-glow transition-smooth">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">AI Stress Coach</h3>
            <p className="text-muted-foreground">
              Get personalized recommendations based on your unique stress patterns and lifestyle factors.
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-2xl bg-gradient-card shadow-soft hover:shadow-glow transition-smooth">
            <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Track Progress</h3>
            <p className="text-muted-foreground">
              Monitor multiple wellness factors including sleep, exercise, nutrition, and social connection.
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-2xl bg-gradient-card shadow-soft hover:shadow-glow transition-smooth">
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Gamified Experience</h3>
            <p className="text-muted-foreground">
              Earn points, maintain streaks, and level up as you build healthier habits and reduce stress.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-accent py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Stress?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users who are managing stress better with our science-backed, gamified approach.
          </p>
          <Button 
            variant="hero" 
            size="lg"
            className="text-lg bg-white text-primary hover:bg-white/90"
            asChild
          >
            <Link to="/dashboard">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
