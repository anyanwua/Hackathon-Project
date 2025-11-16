import { StressTracker } from "@/components/StressTracker";
import { StressCoach } from "@/components/StressCoach";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Your Wellness Dashboard</h1>
          <p className="text-muted-foreground">Track your stress and get personalized insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StressTracker />
          </div>
          <div className="lg:col-span-1">
            <StressCoach />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
