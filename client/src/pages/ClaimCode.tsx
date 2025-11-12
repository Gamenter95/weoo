
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Gift, Plus, Users, DollarSign, MessageSquare, Code as CodeIcon, Clock, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ClaimCode() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [claimCode, setClaimCode] = useState("");
  const [createForm, setCreateForm] = useState({
    totalUsers: "",
    amountPerUser: "",
    comment: "",
    code: "",
  });
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);

  const { data: myCodes = [] } = useQuery<any[]>({
    queryKey: ["/api/gift-codes/my-codes"],
  });

  const { data: claims = [] } = useQuery<any[]>({
    queryKey: ["/api/gift-codes", selectedCodeId, "claims"],
    queryFn: async () => {
      if (!selectedCodeId) return [];
      const res = await apiRequest("GET", `/api/gift-codes/${selectedCodeId}/claims`);
      return await res.json();
    },
    enabled: !!selectedCodeId,
  });

  const claimMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/gift-codes/claim", { code });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Success!",
        description: `You received ₹${data.amount}`,
      });
      setClaimCode("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to claim",
        description: error.message || "Invalid or expired code",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/gift-codes/create", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-codes/my-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Gift Code Created!",
        description: `Code: ${data.giftCode.code}`,
      });
      setCreateForm({ totalUsers: "", amountPerUser: "", comment: "", code: "" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create",
        description: error.message || "Failed to create gift code",
      });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", `/api/gift-codes/${code}/stop`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-codes/my-codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Code Stopped",
        description: `₹${data.refunded} refunded to your balance`,
      });
    },
  });

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (claimCode.trim()) {
      claimMutation.mutate(claimCode.trim().toUpperCase());
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const totalUsers = parseInt(createForm.totalUsers);
    const amountPerUser = parseFloat(createForm.amountPerUser);

    if (isNaN(totalUsers) || totalUsers <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Invalid number of users" });
      return;
    }

    if (isNaN(amountPerUser) || amountPerUser <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Invalid amount" });
      return;
    }

    createMutation.mutate({
      totalUsers,
      amountPerUser,
      comment: createForm.comment || undefined,
      code: createForm.code || undefined,
    });
  };

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
              Gift Codes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and claim gift codes
            </p>
          </div>
        </div>

        <Tabs defaultValue="claim" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="claim">Claim Code</TabsTrigger>
            <TabsTrigger value="create">Create Code</TabsTrigger>
            <TabsTrigger value="history">My Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="claim">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Claim Gift Code
                </CardTitle>
                <CardDescription>
                  Enter a gift code to claim your prize
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleClaim} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="claim-code">Gift Code</Label>
                    <Input
                      id="claim-code"
                      placeholder="Enter gift code"
                      value={claimCode}
                      onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                      className="uppercase font-mono text-lg"
                      data-testid="input-claim-code"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={claimMutation.isPending || !claimCode.trim()}
                    data-testid="button-claim"
                  >
                    Claim Gift
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Gift Code
                </CardTitle>
                <CardDescription>
                  Create a gift code to share with others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total-users">
                        <Users className="h-4 w-4 inline mr-1" />
                        Number of Users
                      </Label>
                      <Input
                        id="total-users"
                        type="number"
                        min="1"
                        placeholder="e.g., 10"
                        value={createForm.totalUsers}
                        onChange={(e) => setCreateForm({ ...createForm, totalUsers: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount-per-user">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        Amount Per User (₹)
                      </Label>
                      <Input
                        id="amount-per-user"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g., 50"
                        value={createForm.amountPerUser}
                        onChange={(e) => setCreateForm({ ...createForm, amountPerUser: e.target.value })}
                      />
                    </div>
                  </div>

                  {createForm.totalUsers && createForm.amountPerUser && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium">
                        Total Cost: ₹{(parseInt(createForm.totalUsers || "0") * parseFloat(createForm.amountPerUser || "0")).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="code">
                      <CodeIcon className="h-4 w-4 inline mr-1" />
                      Custom Code (Optional)
                    </Label>
                    <Input
                      id="code"
                      placeholder="Leave empty for random code"
                      value={createForm.code}
                      onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                      className="uppercase font-mono"
                      data-testid="input-custom-code"
                    />
                    <p className="text-xs text-muted-foreground">
                      A random 7-character code will be generated if not specified
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Comment (Optional)
                    </Label>
                    <Textarea
                      id="comment"
                      placeholder="Add a message..."
                      value={createForm.comment}
                      onChange={(e) => setCreateForm({ ...createForm, comment: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending || !createForm.totalUsers || !createForm.amountPerUser}
                  >
                    Create Gift Code
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  My Gift Codes
                </CardTitle>
                <CardDescription>
                  View and manage your created gift codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myCodes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No gift codes created yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {myCodes.map((code: any) => (
                      <div
                        key={code.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-mono text-2xl font-bold">{code.code}</p>
                            {code.comment && (
                              <p className="text-sm text-muted-foreground mt-1">{code.comment}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              code.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {code.isActive ? 'Active' : 'Stopped'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Amount/User</p>
                            <p className="font-semibold">₹{parseFloat(code.amountPerUser).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Claimed</p>
                            <p className="font-semibold">{code.totalUsers - code.remainingUsers}/{code.totalUsers}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Remaining</p>
                            <p className="font-semibold">₹{(parseFloat(code.amountPerUser) * code.remainingUsers).toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCodeId(code.code)}
                          >
                            View Claims
                          </Button>
                          {code.isActive && code.remainingUsers > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => stopMutation.mutate(code.code)}
                            >
                              Stop & Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedCodeId} onOpenChange={() => setSelectedCodeId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Claims for {selectedCodeId}</DialogTitle>
              <DialogDescription>
                Users who have claimed this gift code
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {claims.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No claims yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>WWID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Claimed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim: any) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.username}</TableCell>
                        <TableCell className="font-mono text-sm">{claim.wwid}</TableCell>
                        <TableCell>₹{parseFloat(claim.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(claim.claimedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
