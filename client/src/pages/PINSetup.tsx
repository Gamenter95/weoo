import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function PINSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [step]);

  const currentPin = step === "create" ? pin : confirmPin;
  const setCurrentPin = step === "create" ? setPin : setConfirmPin;

  const spinMutation = useMutation({
    mutationFn: async (data: { spin: string }) => {
      const res = await apiRequest("POST", "/api/auth/setup-spin", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Created!",
        description: "Your WeooWallet account has been created successfully.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      const errorData = error.response?.data || error;
      if (errorData.sessionExpired) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please start registration again.",
        });
        setTimeout(() => setLocation("/register"), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to setup S-PIN",
        });
      }
    },
  });

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...currentPin];
    newPin[index] = value.slice(-1);
    setCurrentPin(newPin);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !currentPin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === "create") {
      if (pin.every(d => d !== "")) {
        setStep("confirm");
        setConfirmPin(["", "", "", ""]);
      }
    } else {
      const pinString = pin.join("");
      const confirmPinString = confirmPin.join("");

      if (pinString === confirmPinString) {
        spinMutation.mutate({ spin: pinString });
      } else {
        toast({
          variant: "destructive",
          title: "PINs Don't Match",
          description: "Please try again.",
        });
        setStep("create");
        setPin(["", "", "", ""]);
        setConfirmPin(["", "", "", ""]);
      }
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
            <CardTitle className="text-2xl font-bold">
              {step === "create" ? "Create Security PIN" : "Confirm Security PIN"}
            </CardTitle>
            <CardDescription className="mt-2">
              {step === "create"
                ? "Set up your 4-digit S-PIN for secure transactions"
                : "Re-enter your S-PIN to confirm"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-center gap-3">
              {currentPin.map((digit, index) => (
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

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Security Tips:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Don't use obvious PINs (1234, 0000)</li>
                <li>• Keep your S-PIN confidential</li>
                <li>• Used for password changes and sensitive operations</li>
              </ul>
            </div>

            <Button
              type="submit"
              data-testid="button-submit-pin"
              className="w-full"
              size="lg"
              disabled={currentPin.some(d => d === "") || spinMutation.isPending}
            >
              {spinMutation.isPending ? "Creating Account..." : step === "create" ? "Continue" : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
