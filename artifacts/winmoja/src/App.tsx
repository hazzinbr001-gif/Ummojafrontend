import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CampaignConfigProvider, useCampaignConfig } from "@/context/CampaignConfigContext";
import Layout from "@/components/Layout";
import Onboarding from "@/pages/Onboarding";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Voters from "@/pages/Voters";
import Requests from "@/pages/Requests";
import Broadcasts from "@/pages/Broadcasts";
import Referrals from "@/pages/Referrals";
import Volunteers from "@/pages/Volunteers";
import Finance from "@/pages/Finance";
import Manifesto from "@/pages/Manifesto";
import ElectionDay from "@/pages/ElectionDay";
import Users from "@/pages/Users";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,7%)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading WinMoja...</p>
      </div>
    </div>
  );
}

function ProtectedApp() {
  const { user, isLoading: authLoading } = useAuth();
  const { setupComplete, isLoading: configLoading, refresh } = useCampaignConfig();

  if (authLoading || configLoading) return <FullPageSpinner />;

  if (!setupComplete) {
    return <Onboarding onComplete={() => { refresh(); }} />;
  }

  if (!user) return <Login />;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/voters" component={Voters} />
        <Route path="/requests" component={Requests} />
        <Route path="/broadcasts" component={Broadcasts} />
        <Route path="/referrals" component={Referrals} />
        <Route path="/volunteers" component={Volunteers} />
        <Route path="/finance" component={Finance} />
        <Route path="/manifesto" component={Manifesto} />
        <Route path="/election-day" component={ElectionDay} />
        <Route path="/users" component={Users} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CampaignConfigProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <ProtectedApp />
            </WouterRouter>
          </AuthProvider>
        </CampaignConfigProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
