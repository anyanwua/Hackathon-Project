import { StressTracker } from "@/components/StressTracker";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">StressIQ Dashboard</h1>
          <p className="text-muted-foreground">Track your stress and get personalized insights</p>
        </div>

        <div>
          <StressTracker />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
