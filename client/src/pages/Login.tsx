import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/generated_images/WeooWallet_logo_icon_7f926dfd.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    usernameOrPhone: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Please enter your S-PIN to continue.",
      });
      setLocation("/pin-verify");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={logoImage} alt="WeooWallet" className="h-16 w-16" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="mt-2">
              Login to access your WeooWallet
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usernameOrPhone" data-testid="label-username-phone">
                Username or Phone
              </Label>
              <Input
                id="usernameOrPhone"
                data-testid="input-username-phone"
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
              <Label htmlFor="password" data-testid="label-password">Password</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="h-12"
              />
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setLocation("/forgot-spin")}
                >
                  Forgot S-PIN?
                </button>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  data-testid="link-forgot-password"
                  onClick={() => setLocation("/forgot-password")}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
            <Button
              type="submit"
              data-testid="button-login"
              className="w-full"
              size="lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => setLocation("/register")}
                className="text-primary font-medium hover:underline"
                data-testid="link-register"
              >
                Create Account
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
