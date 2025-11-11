
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield } from "lucide-react";

export default function ForgotSPIN() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    usernameOrPhone: "",
    password: "",
  });

  const forgotSpinMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/auth/forgot-spin", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Password verified successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Recovery Failed",
        description: error.message || "Invalid credentials",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotSpinMutation.mutate(formData);
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
            <CardTitle className="text-2xl font-bold">Forgot S-PIN</CardTitle>
            <CardDescription className="mt-2">
              Enter your username/phone and password to recover access
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usernameOrPhone">Username or Phone</Label>
              <Input
                id="usernameOrPhone"
                type="text"
                placeholder="Enter username or phone number"
                value={formData.usernameOrPhone}
                onChange={(e) =>
                  setFormData({ ...formData, usernameOrPhone: e.target.value })
                }
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={forgotSpinMutation.isPending}
            >
              {forgotSpinMutation.isPending ? "Verifying..." : "Recover Access"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setLocation("/login")}
              className="text-sm text-primary font-medium hover:underline"
            >
              Back to Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
