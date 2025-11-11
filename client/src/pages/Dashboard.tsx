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
  avatar?: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const unreadCount = unreadData?.count || 0;

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
    { icon: Globe, label: "API Gateway", onClick: () => { setIsMenuOpen(false); toast({ title: "Coming Soon", description: "API Gateway feature coming soon!" }); } },
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50"></div>
      
      <header className="h-16 border-b border-primary/10 bg-card/90 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-50 shadow-lg relative">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-menu"
              className="hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-card/98 backdrop-blur-xl border-primary/10">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6 p-5 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-2xl border border-primary/20 shadow-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Logged in as</p>
              <p className="font-bold text-xl mb-1">{user.username}</p>
              <p className="text-sm font-mono text-primary bg-primary/10 inline-block px-3 py-1 rounded-full">{user.wwid}</p>
            </div>
            <nav className="mt-6 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 active:scale-95 transition-all duration-200 text-left group"
                >
                  <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-200 group-hover:scale-110">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
              <div className="pt-4 border-t border-primary/10">
                <button
                  onClick={handleLogout}
                  data-testid="menu-logout"
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-destructive/10 active:scale-95 transition-all duration-200 text-left text-destructive group"
                >
                  <div className="p-2.5 rounded-xl bg-destructive/10 group-hover:bg-destructive/20 transition-all duration-200 group-hover:scale-110">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">Logout</span>
                </button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent tracking-tight" data-testid="text-app-name">WeooWallet</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open("https://t.me/WeooWallet", "_blank")}
            className="hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all duration-200"
            title="Contact Support"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-notifications"
            onClick={() => setLocation("/notifications")}
            className="hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all duration-200 relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-red-500/30"></span>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block p-8 rounded-[2rem] bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-primary/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
            <p className="text-sm text-muted-foreground mb-3 font-semibold uppercase tracking-widest">Available Balance</p>
            <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent mb-2 tracking-tight" data-testid="text-balance">
              ₹{parseFloat(user.balance).toFixed(2)}
            </div>
            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"></div>
          </div>
          <div className="flex gap-3 justify-center mt-6">
            <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-sm font-mono font-bold text-primary border border-primary/20 shadow-lg shadow-primary/10">
              {user.wwid}
            </div>
          </div>
        </div>
      </main>

      <div className="border-t border-primary/10 bg-card/90 backdrop-blur-xl p-6 shadow-2xl relative">
        <div className="flex justify-around items-center max-w-md mx-auto gap-3">
          <button
            onClick={() => setLocation("/add-fund")}
            data-testid="button-add-fund"
            className="flex flex-col items-center gap-2.5 hover:scale-110 active:scale-95 transition-all duration-200 p-3 rounded-2xl hover:bg-gradient-to-br hover:from-green-500/5 hover:to-green-600/5"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center shadow-xl shadow-green-500/40 hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-200">
              <Plus className="h-7 w-7" />
            </div>
            <span className="text-xs font-bold">Add Fund</span>
          </button>

          <button
            onClick={() => setLocation("/pay-to-user")}
            data-testid="button-pay"
            className="flex flex-col items-center gap-2.5 hover:scale-110 active:scale-95 transition-all duration-200 p-3 rounded-2xl hover:bg-gradient-to-br hover:from-blue-500/5 hover:to-blue-600/5"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-200">
              <Send className="h-7 w-7" />
            </div>
            <span className="text-xs font-bold">Pay to User</span>
          </button>

          <button
            onClick={() => setLocation("/withdraw")}
            data-testid="button-withdraw"
            className="flex flex-col items-center gap-2.5 hover:scale-110 active:scale-95 transition-all duration-200 p-3 rounded-2xl hover:bg-gradient-to-br hover:from-orange-500/5 hover:to-orange-600/5"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-xl shadow-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-200">
              <ArrowDownToLine className="h-7 w-7" />
            </div>
            <span className="text-xs font-bold">Withdraw</span>
          </button>
        </div>
      </div>
    </div>
  );
}