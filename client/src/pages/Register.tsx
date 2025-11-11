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

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    password: "",
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Registration data saved. Please create your WWID.",
      });
      setLocation("/wwid-setup");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Username or phone already exists",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img src={logoImage} alt="WeooWallet" className="h-16 w-16" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription className="mt-2">
              Start your journey with WeooWallet
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" data-testid="label-username">Username</Label>
              <Input
                id="username"
                data-testid="input-username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" data-testid="label-phone">Phone Number</Label>
              <Input
                id="phone"
                data-testid="input-phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              data-testid="button-register"
              className="w-full"
              size="lg"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating..." : "Continue"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-primary font-medium hover:underline"
                data-testid="link-login"
              >
                Login
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
