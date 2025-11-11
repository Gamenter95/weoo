
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowDownToLine, ArrowLeft } from "lucide-react";

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount: "",
    upiId: "",
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/me");
      return await res.json();
    },
  });

  const calculateFee = (amount: number) => {
    const fee = amount * 0.03;
    const afterFee = amount - fee;
    return { fee, afterFee };
  };

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; upiId: string }) => {
      const res = await apiRequest("POST", "/api/transactions/withdraw", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your withdrawal request has been submitted for processing.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Withdrawal Failed",
        description: error.message || "Failed to submit withdrawal request",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.upiId.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid UPI ID",
        description: "UPI ID must contain '@'",
      });
      return;
    }
    withdrawMutation.mutate({
      amount: parseFloat(formData.amount),
      upiId: formData.upiId,
    });
  };

  const amountNum = parseFloat(formData.amount) || 0;
  const { fee, afterFee } = calculateFee(amountNum);

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
          <h1 className="text-2xl font-bold">Withdraw</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              Withdraw to UPI
            </CardTitle>
            <CardDescription>
              Minimum ₹20 • 3% processing fee applies
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
                <Label htmlFor="amount">Withdrawal Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="20"
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

              {amountNum >= 20 && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Withdrawal Amount:</span>
                    <span className="font-semibold">₹{amountNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Processing Fee (3%):</span>
                    <span>- ₹{fee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>You'll Receive:</span>
                    <span className="text-green-600">₹{afterFee.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  type="text"
                  placeholder="yourname@upi"
                  value={formData.upiId}
                  onChange={(e) =>
                    setFormData({ ...formData, upiId: e.target.value })
                  }
                  required
                  className="h-12 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Must contain @ symbol (e.g., yourname@paytm)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={withdrawMutation.isPending || amountNum < 20}
              >
                {withdrawMutation.isPending ? "Submitting..." : "Submit Withdrawal Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
