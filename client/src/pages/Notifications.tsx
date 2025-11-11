
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Bell, CheckCircle, XCircle, DollarSign } from "lucide-react";

export default function Notifications() {
  const [, setLocation] = useLocation();

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/mark-all-read");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  useEffect(() => {
    // Mark all as read when page loads
    markAllReadMutation.mutate();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="h-16 border-b bg-card/80 backdrop-blur-lg flex items-center px-4 sticky top-0 z-50 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Notifications
        </h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif: any) => (
            <Card key={notif.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  notif.type === 'fund_approved' || notif.type === 'payment_received' ? 'bg-green-100' :
                  notif.type === 'fund_declined' || notif.type === 'withdraw_declined' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  {notif.type === 'fund_approved' || notif.type === 'withdraw_approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : notif.type === 'fund_declined' || notif.type === 'withdraw_declined' ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{notif.title}</p>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
