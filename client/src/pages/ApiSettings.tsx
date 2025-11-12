import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Copy, RefreshCw, Key, AlertCircle, CheckCircle2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ApiSettings {
  id: string;
  userId: string;
  apiEnabled: boolean;
  apiToken: string | null;
  domain: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function ApiSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<ApiSettings>({
    queryKey: ["/api/api-settings"],
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("POST", "/api/api-settings/toggle", { enabled });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-settings"] });
      toast({
        title: "Success",
        description: "API settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update settings",
      });
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/api-settings/generate-token", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-settings"] });
      toast({
        title: "Token Generated",
        description: "New API token generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate token",
      });
    },
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/api-settings/revoke-token", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-settings"] });
      toast({
        title: "Token Revoked",
        description: "API token has been revoked and API disabled",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to revoke token",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API endpoint copied to clipboard",
    });
  };

  const apiPaymentNotifications = notifications.filter(
    (n) => n.type === "api_payment_sent" || n.type === "payment_received"
  );

  const getEndpointUrl = () => {
    const domain = settings?.domain || "https://wwallet.koyeb.app";
    const token = settings?.apiToken || "{TOKEN}";
    return `${domain}/api/wallet?type=wallet&token=${token}&wwid={WWID}&amount={AMOUNT}`;
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              API Gateway
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your API settings and monitor payment transactions
            </p>
          </div>
        </div>

        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Enable API access and manage your authentication token
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-semibold">API Access</Label>
                <p className="text-sm text-muted-foreground">
                  {settings?.apiEnabled
                    ? "API payments are currently enabled"
                    : "API payments are currently disabled"}
                </p>
              </div>
              <Switch
                checked={settings?.apiEnabled || false}
                onCheckedChange={(checked) => toggleMutation.mutate(checked)}
                disabled={toggleMutation.isPending || !settings?.apiToken}
                data-testid="switch-api-enabled"
              />
            </div>

            {!settings?.apiToken && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    No API Token
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Generate an API token to enable API payments
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>API Token</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={settings?.apiToken || "No token generated"}
                    readOnly
                    className="font-mono"
                    data-testid="input-api-token"
                  />
                  <Button
                    variant="outline"
                    onClick={() => generateTokenMutation.mutate()}
                    disabled={generateTokenMutation.isPending}
                    data-testid="button-generate-token"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${generateTokenMutation.isPending ? 'animate-spin' : ''}`} />
                    Generate
                  </Button>
                  {settings?.apiToken && (
                    <Button
                      variant="destructive"
                      onClick={() => revokeTokenMutation.mutate()}
                      disabled={revokeTokenMutation.isPending}
                      data-testid="button-revoke-token"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {settings?.apiToken && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                API Endpoint
              </CardTitle>
              <CardDescription>
                Use this endpoint to make payments via API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Wallet Payment Endpoint</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={getEndpointUrl()}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-endpoint"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(getEndpointUrl())}
                    data-testid="button-copy-endpoint"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold">Parameters:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>
                    <code className="px-2 py-1 bg-background rounded">type</code>: wallet (required)
                  </li>
                  <li>
                    <code className="px-2 py-1 bg-background rounded">token</code>: Your API token
                  </li>
                  <li>
                    <code className="px-2 py-1 bg-background rounded">wwid</code>: Recipient's WWID
                  </li>
                  <li>
                    <code className="px-2 py-1 bg-background rounded">amount</code>: Payment amount
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              API Payment History
            </CardTitle>
            <CardDescription>
              Recent payments made through the API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiPaymentNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No API payments yet</p>
                <p className="text-sm mt-2">
                  Payments made via the API will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiPaymentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 bg-muted/50 rounded-lg border border-primary/20"
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
