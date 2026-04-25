import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, Lock, Mail, CheckCircle2, LogOut, Trash2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { apiAuth } from "@/lib/api-backend";
import ProfileDashboard from "@/components/dashboard/ProfileDashboard";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string; username: string }>({ id: "", email: "", username: "" });
  const [info, setInfo] = useState({ username: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [deletePassword, setDeletePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { session } = await apiAuth.getSession();
        if (!session || !session.user) {
          navigate("/");
          return;
        }

        const userData = {
          id: session.user.id,
          email: session.user.email || "",
          username: session.user.username || ""
        };
        
        setUser(userData);
        setInfo({ username: userData.username, email: userData.email });
      } catch (err) {
        toast.error("Failed to load profile");
        navigate("/");
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info.username || !info.email) return toast.error("Username and email are required");
    
    setLoading(true);
    try {
      const data = await apiAuth.updateProfile({
        username: info.username
      });

      if (data.success) {
        setUser({ ...user, username: info.username });
        toast.success("Profile updated successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while updating profile");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      return toast.error("Fill all password fields");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      const data = await apiAuth.updatePassword({
        password: passwordForm.newPassword
      });

      if (data.success) {
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        toast.success("Password updated successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while updating password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await apiAuth.logout();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      return toast.error("Please enter your password to confirm deletion");
    }

    if (!deleteConfirmed) {
      return toast.error("You must check the confirmation checkbox");
    }

    setLoading(true);
    try {
      const data = await apiAuth.deleteAccount({
        password: deletePassword
      });

      if (data.success) {
        toast.success("Account deleted successfully. Redirecting...");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while deleting your account");
      setDeletePassword("");
      setDeleteConfirmed(false);
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen cyber-grid flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-grid py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Enhanced Professional Profile Header */}
        <div className="relative bg-card/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl overflow-hidden group">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 group-hover:bg-primary/10"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Dynamic Avatar Section */}
              <div className="relative">
                {/* Glowing Ring */}
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-transparent rounded-full blur opacity-40 group-hover:opacity-70 transition duration-700" />
                
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-muted/50 to-card border border-white/10 flex items-center justify-center text-2xl font-black text-primary shadow-2xl">
                  {(user.username || 'G').charAt(0).toUpperCase()}
                </div>
                
                {/* Active Status Dot */}
                <div className="absolute bottom-0 right-1 w-4 h-4 bg-emerald-500 border-[3px] border-[#0a0a0a] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>

              {/* User Info Section */}
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {user.username || "Your Profile"}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-sm text-muted-foreground font-medium opacity-80">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Action Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => navigate("/")} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-foreground/80 hover:bg-white/10 hover:text-foreground transition-all active:scale-95"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
              <button 
                onClick={handleLogout} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/5 border border-red-500/10 text-xs font-bold text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Overview Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-foreground">Dashboard Overview</h2>
            <p className="text-sm text-muted-foreground mt-1">Monitor your security activity and scan history</p>
          </div>
          <ProfileDashboard userId={parseInt(user.id)} />
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="bg-card border border-border rounded-2xl p-6 glass">
            <h2 className="text-lg font-semibold text-foreground mb-4">Update Profile</h2>
            <form onSubmit={updateProfile} className="space-y-3">
              <label className="block text-sm text-muted-foreground">Username</label>
              <Input
                value={info.username}
                onChange={(e) => setInfo((prev) => ({ ...prev, username: e.target.value }))}
                className="bg-muted border-border text-foreground"
              />
              <label className="block text-sm text-muted-foreground">Email</label>
              <Input
                value={info.email}
                disabled
                className="bg-muted border-border text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </section>

          <section className="bg-card border border-border rounded-2xl p-6 glass">
            <h2 className="text-lg font-semibold text-foreground mb-4">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-3">
              <label className="block text-sm text-muted-foreground">Current Password</label>
              <Input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
                className="bg-muted border-border text-foreground"
              />
              <label className="block text-sm text-muted-foreground">New Password</label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="bg-muted border-border text-foreground"
              />
              <label className="block text-sm text-muted-foreground">Confirm Password</label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="bg-muted border-border text-foreground"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Change Password"}
              </Button>
            </form>
          </section>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 glass flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Keep your password safe and never share it with anyone.
        </div>

        <div className="bg-destructive/10 border-2 border-destructive/30 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Deleting your account will permanently remove all your data, including scan history and profile information. This action cannot be undone.
            </p>
          </div>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            className="w-full"
          >
            Delete Account
          </Button>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-card border border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">Delete Account?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently delete your account and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Enter your password to confirm:
                </label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <input
                  type="checkbox"
                  id="confirm-delete"
                  checked={deleteConfirmed}
                  onChange={(e) => setDeleteConfirmed(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="confirm-delete"
                  className="text-sm text-muted-foreground cursor-pointer flex-1"
                >
                  I understand this action is permanent and cannot be reversed
                </label>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel className="bg-muted hover:bg-muted/80">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={loading || !deletePassword || !deleteConfirmed}
                className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Profile;
