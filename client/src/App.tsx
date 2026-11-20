import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { NavBar } from "./components/NavBar";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import USA from "./pages/USA";
import Europe from "./pages/Europe";
import SouthAmerica from "./pages/SouthAmerica";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/england" component={Home} />
      <Route path="/usa" component={USA} />
      <Route path="/europe" component={Europe} />
      <Route path="/south-america" component={SouthAmerica} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          {/* Full-viewport flex column: NavBar → page content */}
          <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
            {/* Hash links (#/england) work on any static host, including GitHub Pages */}
            <WouterRouter hook={useHashLocation}>
              <NavBar />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Router />
              </div>
            </WouterRouter>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
