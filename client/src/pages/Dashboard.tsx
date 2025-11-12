import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Send, ArrowDownToLine, Home, Wallet, CreditCard, Globe, User, LogOut, Bell, Phone, MessageCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserData {
  id: string;
  username: string;
  phone: string;
  wwid: string;
  balance: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      setLocation("/login");
    },
  });

  const handleLogout = () => {
    setIsMenuOpen(false);
    logoutMutation.mutate();
  };

  const menuItems = [
    { icon: Home, label: "Home", onClick: () => { setIsMenuOpen(false); setLocation("/dashboard"); } },
    { icon: Plus, label: "Add Fund", onClick: () => { setIsMenuOpen(false); setLocation("/add-fund"); } },
    { icon: Send, label: "Pay to User", onClick: () => { setIsMenuOpen(false); setLocation("/pay-to-user"); } },
    { icon: ArrowDownToLine, label: "Withdraw", onClick: () => { setIsMenuOpen(false); setLocation("/withdraw"); } },
    { icon: Wallet, label: "Transactions", onClick: () => { setIsMenuOpen(false); setLocation("/transactions"); } },
    { icon: Globe, label: "API Gateway", onClick: () => { setIsMenuOpen(false); setLocation("/api"); } },
    { icon: CreditCard, label: "Gift Codes", onClick: () => { setIsMenuOpen(false); setLocation("/claim-code"); } },
    { icon: User, label: "Profile", onClick: () => { setIsMenuOpen(false); setLocation("/profile"); } },
    { icon: MessageCircle, label: "Contact Us", onClick: () => { setIsMenuOpen(false); window.open("https://t.me/WeooWallet", "_blank"); } },
  ];

  if (isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <header className="h-16 border-b bg-card/80 backdrop-blur-lg flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-menu"
              className="hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-card/95 backdrop-blur-lg flex flex-col">
            <SheetHeader className="flex-shrink-0">
              <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 flex-shrink-0">
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="font-bold text-lg">{user.username}</p>
              <p className="text-sm font-mono text-primary">{user.wwid}</p>
            </div>
            <nav className="mt-6 space-y-2 flex-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-primary/10 active:scale-95 transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <div className="pt-4 border-t">
                <button
                  onClick={handleLogout}
                  data-testid="menu-logout"
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-destructive/10 active:scale-95 transition-all text-left text-destructive group"
                >
                  <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent" data-testid="text-app-name">WeooWallet</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open("https://t.me/WeooWallet", "_blank")}
            className="hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-notifications"
            onClick={() => setLocation("/notifications")}
            className="hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all relative"
          >
            <Bell className="h-5 w-5" />
            {notifications && notifications.length > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
        <div className="text-center space-y-4 relative z-10">
          <div className="inline-block p-6 rounded-3xl bg-card/50 backdrop-blur-sm border border-primary/10 shadow-2xl">
            <p className="text-sm text-muted-foreground mb-2 font-medium">Available Balance</p>
            <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent" data-testid="text-balance">
              ₹{parseFloat(user.balance).toFixed(2)}
            </div>
          </div>
          <div className="flex gap-2 justify-center mt-4">
            <div className="px-4 py-2 rounded-full bg-primary/10 text-sm font-mono text-primary">
              {user.wwid}
            </div>
          </div>
        </div>
      </main>

      <div className="border-t bg-card/80 backdrop-blur-lg p-6 shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto gap-2">
          <button
            onClick={() => setLocation("/add-fund")}
            data-testid="button-add-fund"
            className="flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all p-3 rounded-2xl hover:bg-primary/5"
          >
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/30">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold">Add Fund</span>
          </button>

          <button
            onClick={() => setLocation("/pay-to-user")}
            data-testid="button-pay"
            className="flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all p-3 rounded-2xl hover:bg-primary/5"
          >
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Send className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold">Pay to User</span>
          </button>

          <button
            onClick={() => setLocation("/withdraw")}
            data-testid="button-withdraw"
            className="flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all p-3 rounded-2xl hover:bg-primary/5"
          >
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ArrowDownToLine className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold">Withdraw</span>
          </button>
        </div>
      </div>
    </div>
  );
}