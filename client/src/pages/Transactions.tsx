
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Transaction {
  id: string;
  senderId: string;
  recipientId: string;
  amount: string;
  createdAt: string;
  senderWWID: string;
  senderUsername: string;
  recipientWWID: string;
  recipientUsername: string;
}

export default function Transactions() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Transactions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View all your payment history
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>
              All your sent and received payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No transactions yet</p>
                <p className="text-sm mt-2">Your payment history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const isSent = transaction.senderId === user?.id;
                  const otherUser = isSent
                    ? {
                        wwid: transaction.recipientWWID,
                        username: transaction.recipientUsername,
                      }
                    : {
                        wwid: transaction.senderWWID,
                        username: transaction.senderUsername,
                      };

                  return (
                    <div
                      key={transaction.id}
                      className="p-4 bg-muted/50 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isSent
                                ? "bg-orange-100 dark:bg-orange-950"
                                : "bg-green-100 dark:bg-green-950"
                            }`}
                          >
                            {isSent ? (
                              <ArrowUpRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            ) : (
                              <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {isSent ? "Sent to" : "Received from"} {otherUser.username}
                            </p>
                            <p className="text-sm text-muted-foreground font-mono">
                              {otherUser.wwid}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xl font-bold ${
                              isSent ? "text-orange-600" : "text-green-600"
                            }`}
                          >
                            {isSent ? "-" : "+"}₹{parseFloat(transaction.amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
