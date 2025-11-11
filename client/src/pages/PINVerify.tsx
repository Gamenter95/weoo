import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function PINVerify() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pin, setPin] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const verifyMutation = useMutation({
    mutationFn: async (data: { spin: string }) => {
      return await apiRequest("/api/auth/verify-pin", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Welcome!",
        description: "S-PIN verified successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid S-PIN",
      });
      setPin(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.every(d => d !== "")) {
      verifyMutation.mutate({ spin: pin.join("") });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Enter Security PIN</CardTitle>
            <CardDescription className="mt-2">
              Enter your 4-digit S-PIN to access your wallet
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-center gap-3">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  data-testid={`input-pin-${index}`}
                  className="w-14 h-14 text-center text-2xl font-bold rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ))}
            </div>

            <Button
              type="submit"
              data-testid="button-verify-pin"
              className="w-full"
              size="lg"
              disabled={pin.some(d => d === "") || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify & Continue"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                data-testid="link-forgot-pin"
                onClick={() => toast({ title: "Coming Soon", description: "S-PIN reset feature coming soon!" })}
              >
                Forgot S-PIN?
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
