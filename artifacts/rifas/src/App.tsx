import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import CreateRaffle from "@/pages/create-raffle";
import RaffleDetail from "@/pages/raffle-detail";
import NotFound from "@/pages/not-found";
import Setup from "@/pages/setup";
import { AppSettingsProvider, useAppSettings } from "@/lib/app-settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/raffles/new" component={CreateRaffle} />
        <Route path="/raffles/:id" component={RaffleDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return <AppSettingsProvider><ConfiguredApp /></AppSettingsProvider>;
}

function ConfiguredApp() {
  const { settings } = useAppSettings();
  if (!settings.configured) return <Setup />;
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter hook={useHashLocation}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
