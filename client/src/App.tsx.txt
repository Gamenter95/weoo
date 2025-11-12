import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Register from "@/pages/Register";
import WWIDSetup from "@/pages/WWIDSetup";
import PINSetup from "@/pages/PINSetup";
import Login from "@/pages/Login";
import PINVerify from "@/pages/PINVerify";
import Dashboard from "@/pages/Dashboard";
import ForgotPassword from "@/pages/ForgotPassword";
import ForgotSPIN from "@/pages/ForgotSPIN";
import AddFund from "@/pages/AddFund";
import PayToUser from "@/pages/PayToUser";
import Withdraw from "@/pages/Withdraw";
import Secret from "@/pages/Secret";
import Admin from "@/pages/Admin";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import ApiSettings from "./pages/ApiSettings";
import ClaimCode from "./pages/ClaimCode";
import TransactionsPage from "@/pages/Transactions"; // Corrected import path and name
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Register} />
      <Route path="/register" component={Register} />
      <Route path="/wwid-setup" component={WWIDSetup} />
      <Route path="/pin-setup" component={PINSetup} />
      <Route path="/login" component={Login} />
      <Route path="/pin-verify" component={PINVerify} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/forgot-spin" component={ForgotSPIN} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/add-fund" component={AddFund} />
      <Route path="/pay-to-user" component={PayToUser} />
      <Route path="/withdraw" component={Withdraw} />
      <Route path="/secret" component={Secret} />
      <Route path="/transactions" component={TransactionsPage} /> {/* Corrected component name */}
      <Route path="/admin" component={Admin} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/profile" component={Profile} />
      <Route path="/api" component={ApiSettings} />
      <Route path="/claim-code" component={ClaimCode} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;