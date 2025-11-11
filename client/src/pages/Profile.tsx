
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, User, Phone, KeyRound, CreditCard, Edit, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserData {
  id: string;
  username: string;
  phone: string;
  wwid: string;
  balance: string;
  avatar?: string;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    field: "username" | "phone" | "password" | "spin" | "wwid" | "avatar" | null;
  }>({ open: false, field: null });
  const [formData, setFormData] = useState({
    value: "",
    verifyWith: "",
  });

  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { field: string; value: string; verifyWith: string }) => {
      const res = await apiRequest("POST", "/api/profile/update", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Updated Successfully",
        description: data.message || "Your profile has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setEditDialog({ open: false, field: null });
      setFormData({ value: "", verifyWith: "" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile",
      });
    },
  });

  const handleEdit = (field: "username" | "phone" | "password" | "spin" | "wwid" | "avatar") => {
    setEditDialog({ open: true, field });
    setFormData({ value: "", verifyWith: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDialog.field) return;

    updateMutation.mutate({
      field: editDialog.field,
      value: formData.value,
      verifyWith: formData.verifyWith,
    });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const getDialogTitle = () => {
    switch (editDialog.field) {
      case "username": return "Change Username";
      case "phone": return "Change Phone Number";
      case "password": return "Change Password";
      case "spin": return "Change S-PIN";
      case "wwid": return "Change WWID (₹10 Fee)";
      case "avatar": return "Change Avatar";
      default: return "Edit Profile";
    }
  };

  const getVerifyLabel = () => {
    if (editDialog.field === "spin") return "Enter Password";
    return "Enter S-PIN (4 digits)";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="h-16 border-b bg-card/80 backdrop-blur-lg flex items-center px-4 sticky top-0 z-50 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          My Profile
        </h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex flex-col items-center mb-4">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar || "/WeooWallet_logo_icon_7f926dfd.png"} alt={user.username} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit("avatar")}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary/90 hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
            <CardTitle className="text-center text-2xl">{user.username}</CardTitle>
            <CardDescription className="text-center font-mono">{user.wwid}</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>View and update your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{user.username}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEdit("username")}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEdit("phone")}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">WWID</p>
                  <p className="font-medium font-mono">{user.wwid}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEdit("wwid")}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your security credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Password</p>
                  <p className="font-medium">••••••••</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEdit("password")}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">S-PIN</p>
                  <p className="font-medium">••••</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEdit("spin")}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, field: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              {editDialog.field === "wwid" && "Note: Changing WWID costs ₹10. Your old WWID will become available for others."}
              {editDialog.field === "spin" && "Verify with your password to change S-PIN"}
              {editDialog.field !== "wwid" && editDialog.field !== "spin" && "Verify with S-PIN to update"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>
                {editDialog.field === "username" && "New Username"}
                {editDialog.field === "phone" && "New Phone Number"}
                {editDialog.field === "password" && "New Password"}
                {editDialog.field === "spin" && "New S-PIN (4 digits)"}
                {editDialog.field === "wwid" && "New WWID"}
                {editDialog.field === "avatar" && "Avatar Image URL"}
              </Label>
              <Input
                type={editDialog.field === "password" ? "password" : editDialog.field === "spin" ? "password" : "text"}
                inputMode={editDialog.field === "spin" ? "numeric" : editDialog.field === "phone" ? "tel" : "text"}
                maxLength={editDialog.field === "spin" ? 4 : undefined}
                placeholder={editDialog.field === "avatar" ? "Enter image URL or leave empty for default" : `Enter new ${editDialog.field}`}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required={editDialog.field !== "avatar"}
              />
            </div>
            {editDialog.field !== "avatar" && (
              <div className="space-y-2">
                <Label>{getVerifyLabel()}</Label>
                <Input
                  type="password"
                  inputMode={editDialog.field === "spin" ? "text" : "numeric"}
                  maxLength={editDialog.field === "spin" ? undefined : 4}
                  placeholder={editDialog.field === "spin" ? "Enter password" : "Enter S-PIN"}
                  value={formData.verifyWith}
                  onChange={(e) => setFormData({ ...formData, verifyWith: e.target.value })}
                  required
                />
              </div>
            )}
            {editDialog.field === "wwid" && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  ₹10 will be deducted from your balance
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialog({ open: false, field: null })} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
                {updateMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
