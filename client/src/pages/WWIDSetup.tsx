import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function WWIDSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [wwid, setWwid] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateWWID = (value: string) => {
    const regex = /^[a-z0-9]{3,20}$/;
    setIsValid(regex.test(value));
  };

  const handleWWIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
    setWwid(value);
    if (value) {
      validateWWID(value);
    } else {
      setIsValid(null);
    }
  };

  const wwidMutation = useMutation({
    mutationFn: async (data: { wwid: string }) => {
      const res = await apiRequest("POST", "/api/auth/setup-wwid", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "WWID created successfully!",
      });
      setLocation("/pin-setup");
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
          description: error.message || "Failed to create WWID",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      wwidMutation.mutate({ wwid });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">₹</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Create Your WWID</CardTitle>
            <CardDescription className="mt-2">
              Your unique WeooWallet ID for receiving payments
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="wwid" data-testid="label-wwid">WeooWallet ID</Label>
              <div className="relative">
                <Input
                  id="wwid"
                  data-testid="input-wwid"
                  type="text"
                  placeholder="yourname"
                  value={wwid}
                  onChange={handleWWIDChange}
                  required
                  className="h-12 pr-20 font-mono"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-muted-foreground font-mono">@ww</span>
                  {isValid !== null && (
                    <div data-testid="wwid-validation">
                      {isValid ? (
                        <Check className="h-5 w-5 text-primary" />
                      ) : (
                        <X className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Example: weox@ww or john123@ww
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">WWID Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 3-20 characters long</li>
                <li>• Only lowercase letters and numbers</li>
                <li>• No special characters or spaces</li>
                <li>• Must be unique (one per user)</li>
              </ul>
            </div>

            <Button
              type="submit"
              data-testid="button-create-wwid"
              className="w-full"
              size="lg"
              disabled={!isValid || wwidMutation.isPending}
            >
              {wwidMutation.isPending ? "Creating..." : "Create WWID"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}