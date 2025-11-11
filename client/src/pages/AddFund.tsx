
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Download, Plus, ArrowLeft } from "lucide-react";

export default function AddFund() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showUtrInput, setShowUtrInput] = useState(false);

  const calculateFee = (amount: number) => {
    const fee = amount * 0.03;
    const afterFee = amount - fee;
    return { fee, afterFee };
  };

  const generateQR = () => {
    const amountNum = parseFloat(amount);
    if (amountNum < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Minimum amount is ₹10",
      });
      return;
    }

    const upiUrl = `upi://pay?pa=althafx@fam&pn=WeooWallet&am=${amountNum}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;
    setQrCodeUrl(qrUrl);
    setShowUtrInput(true);
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `WeooWallet_Payment_${amount}.png`;
    link.click();
  };

  const addFundMutation = useMutation({
    mutationFn: async (data: { amount: number; utr: string }) => {
      const res = await apiRequest("POST", "/api/transactions/add-fund", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your fund request has been submitted for approval.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit fund request",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (utr.length !== 12) {
      toast({
        variant: "destructive",
        title: "Invalid UTR",
        description: "UTR must be exactly 12 characters",
      });
      return;
    }
    addFundMutation.mutate({ amount: parseFloat(amount), utr });
  };

  const amountNum = parseFloat(amount) || 0;
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
          <h1 className="text-2xl font-bold">Add Fund</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Money to Wallet
            </CardTitle>
            <CardDescription>
              Minimum ₹10 • 3% processing fee applies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!qrCodeUrl ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Enter Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="10"
                    step="1"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                {amountNum >= 10 && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Amount:</span>
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

                <Button
                  onClick={generateQR}
                  className="w-full"
                  size="lg"
                  disabled={amountNum < 10}
                >
                  Generate Payment QR Code
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center space-y-4">
                  <img
                    src={qrCodeUrl}
                    alt="Payment QR Code"
                    className="mx-auto rounded-lg border-2 border-primary/20"
                  />
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with any UPI app to pay ₹{amount}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadQR}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>

                {showUtrInput && (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm">
                      <p className="font-semibold mb-2">How to get UTR number:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Complete the payment using the QR code</li>
                        <li>Check your payment app's transaction history</li>
                        <li>Find the 12-digit UTR/Transaction ID</li>
                        <li>Enter it below to complete the request</li>
                      </ol>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="utr">UTR / Transaction ID</Label>
                      <Input
                        id="utr"
                        type="text"
                        maxLength={12}
                        placeholder="Enter 12-digit UTR number"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                        required
                        className="h-12 font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be exactly 12 digits
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={utr.length !== 12 || addFundMutation.isPending}
                    >
                      {addFundMutation.isPending ? "Submitting..." : "Submit Fund Request"}
                    </Button>
                  </>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
