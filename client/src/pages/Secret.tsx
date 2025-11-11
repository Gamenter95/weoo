
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

export default function Secret() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === "95weox") {
      sessionStorage.setItem("adminAuth", "true");
      toast({
        title: "Access Granted",
        description: "Welcome to the admin panel.",
      });
      setLocation("/admin");
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid admin password.",
      });
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
      <Card className="w-full max-w-md border-destructive/20 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <CardDescription className="mt-2">
              Enter the admin password to continue
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-destructive hover:bg-destructive/90"
              size="lg"
            >
              Access Admin Panel
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setLocation("/dashboard")}
              className="text-sm text-primary font-medium hover:underline"
            >
              Back to Dashboard
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
