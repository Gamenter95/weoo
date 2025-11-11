import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Send, ArrowDownToLine, Home, Wallet, CreditCard, Globe, User, LogOut } from "lucide-react";
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
    { icon: Home, label: "Home", onClick: () => { setIsMenuOpen(false); } },
    { icon: Plus, label: "Add Fund", onClick: () => { setIsMenuOpen(false); toast({ title: "Coming Soon", description: "Add Fund feature coming soon!" }); } },
    { icon: Send, label: "Pay to User", onClick: () => { setIsMenuOpen(false); toast({ title: "Coming Soon", description: "Pay to User feature coming soon!" }); } },
    { icon: ArrowDownToLine, label: "Withdraw", onClick: () => { setIsMenuOpen(false); toast({ title: "Coming Soon", description: "Withdraw feature coming soon!" }); } },
    { icon: Globe, label: "API Gateway", onClick: () => { setIsMenuOpen(false); toast({ title: "Coming Soon", description: "API Gateway feature coming soon!" }); } },
    { icon: User, label: "Profile", onClick: () => { setIsMenuOpen(false); toast({ title: "Coming Soon", description: "Profile feature coming soon!" }); } },
  ];

  if (isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-16 border-b flex items-center justify-between px-4 bg-card">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-menu"
              className="hover-elevate active-elevate-2"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="font-bold">{user.username}</p>
              <p className="text-sm font-mono text-muted-foreground">{user.wwid}</p>
            </div>
            <nav className="mt-6 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover-elevate active-elevate-2 text-left"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <div className="pt-4 border-t">
                <button
                  onClick={handleLogout}
                  data-testid="menu-logout"
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover-elevate active-elevate-2 text-left text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-bold" data-testid="text-app-name">WeooWallet</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="text-6xl font-bold" data-testid="text-balance">₹{user.balance}</div>
          <p className="text-sm text-muted-foreground">Available Balance</p>
        </div>
      </main>

      <div className="border-t bg-card p-6">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setLocation("/add-fund")}
            data-testid="button-add-fund"
            className="flex flex-col items-center gap-2 hover-elevate active-elevate-2 p-3 rounded-lg"
          >
            <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">Add Fund</span>
          </button>

          <button
            onClick={() => setLocation("/pay-to-user")}
            data-testid="button-pay"
            className="flex flex-col items-center gap-2 hover-elevate active-elevate-2 p-3 rounded-lg"
          >
            <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Send className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">Pay to User</span>
          </button>

          <button
            onClick={() => setLocation("/withdraw")}
            data-testid="button-withdraw"
            className="flex flex-col items-center gap-2 hover-elevate active-elevate-2 p-3 rounded-lg"
          >
            <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <ArrowDownToLine className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">Withdraw</span>
          </button>
        </div>
      </div>
    </div>
  );
}
