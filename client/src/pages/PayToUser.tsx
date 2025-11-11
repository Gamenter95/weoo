
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, ArrowLeft } from "lucide-react";

export default function PayToUser() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    recipientWWID: "",
    amount: "",
    spin: "",
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/me");
      return await res.json();
    },
  });

  const payMutation = useMutation({
    mutationFn: async (data: { recipientWWID: string; amount: number; spin: string }) => {
      const res = await apiRequest("POST", "/api/transactions/pay-to-user", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Money sent successfully!",
      });
      window.location.href = "/dashboard";
    },
    onError: (error: any) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Failed to send payment",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    payMutation.mutate({
      recipientWWID: formData.recipientWWID,
      amount: parseFloat(formData.amount),
      spin: formData.spin,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Pay to User</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Money
            </CardTitle>
            <CardDescription>
              Instant transfer • No fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {user && (
                <div className="bg-muted/50 p-4 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Balance:</span>
                    <span className="font-bold text-lg">₹{user.balance}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="recipientWWID">Recipient WWID</Label>
                <Input
                  id="recipientWWID"
                  type="text"
                  placeholder="username@ww"
                  value={formData.recipientWWID}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientWWID: e.target.value })
                  }
                  required
                  className="h-12 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spin">S-PIN (4 digits)</Label>
                <Input
                  id="spin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Enter your S-PIN"
                  value={formData.spin}
                  onChange={(e) =>
                    setFormData({ ...formData, spin: e.target.value.replace(/\D/g, '') })
                  }
                  required
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={payMutation.isPending}
              >
                {payMutation.isPending ? "Processing..." : "Send Payment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
