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
import Canada from "./pages/Canada";
import MiddleEast from "./pages/MiddleEast";
import India from "./pages/India";
import Caribbean from "./pages/Caribbean";
import CentralAmerica from "./pages/CentralAmerica";
import SouthernAfrica from "./pages/SouthernAfrica";
import CentralEastAfrica from "./pages/CentralEastAfrica";
import WestAfrica from "./pages/WestAfrica";
import NorthAfrica from "./pages/NorthAfrica";
import NewZealand from "./pages/NewZealand";
import Australia from "./pages/Australia";
import SoutheastAsia from "./pages/SoutheastAsia";
import SouthCentralAsia from "./pages/SouthCentralAsia";
import EastAsia from "./pages/EastAsia";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/england" component={Home} />
      <Route path="/usa" component={USA} />
      <Route path="/europe" component={Europe} />
      <Route path="/south-america" component={SouthAmerica} />
      <Route path="/canada" component={Canada} />
      <Route path="/middle-east" component={MiddleEast} />
      <Route path="/india" component={India} />
      <Route path="/caribbean" component={Caribbean} />
      <Route path="/central-america" component={CentralAmerica} />
      <Route path="/southern-africa" component={SouthernAfrica} />
      <Route path="/central-east-africa" component={CentralEastAfrica} />
      <Route path="/west-africa" component={WestAfrica} />
      <Route path="/north-africa" component={NorthAfrica} />
      <Route path="/new-zealand" component={NewZealand} />
      <Route path="/australia" component={Australia} />
      <Route path="/southeast-asia" component={SoutheastAsia} />
      <Route path="/south-central-asia" component={SouthCentralAsia} />
      <Route path="/east-asia" component={EastAsia} />
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
