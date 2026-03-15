import { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { getLevelForXp } from "@/lib/levels";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  xp: number;
  streak: number;
  level: number;
  country: string | null;
  last_activity_date: string | null;
  created_at: string;
  interests: string[] | null;
}

type SortKey = "xp" | "streak" | "created_at" | "display_name";

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setUsers(data as UserProfile[]);
      setLoading(false);
    };
    init();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { user_id: deleteTarget.user_id },
    });

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to delete user");
    } else {
      toast.success(`${deleteTarget.display_name || "User"} permanently deleted`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    }

    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const filtered = users
    .filter(u => {
      const q = search.toLowerCase();
      return !q || (u.display_name?.toLowerCase().includes(q)) || u.user_id.includes(q);
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortKey) {
        case "xp": aVal = a.xp; bVal = b.xp; break;
        case "streak": aVal = a.streak; bVal = b.streak; break;
        case "display_name": aVal = a.display_name || ""; bVal = b.display_name || ""; break;
        default: aVal = a.created_at; bVal = b.created_at;
      }
      if (typeof aVal === "string") return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} users</span>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("display_name")} className="flex items-center gap-1">
                    User <SortIcon col="display_name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("xp")} className="flex items-center gap-1">
                    XP <SortIcon col="xp" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("streak")} className="flex items-center gap-1">
                    Streak <SortIcon col="streak" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Country</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Interests</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("created_at")} className="flex items-center gap-1">
                    Joined <SortIcon col="created_at" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Active</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
              ) : (
                filtered.map((user) => {
                  const lvl = getLevelForXp(user.xp);
                  const isSelf = user.user_id === currentUserId;
                  return (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-foreground">{user.display_name || "Anonymous"}</span>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.user_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-foreground">
                          {lvl.emoji} Lv.{lvl.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">{user.xp.toLocaleString()}</td>
                      <td className="px-4 py-3 text-foreground">{user.streak} 🔥</td>
                      <td className="px-4 py-3 text-foreground">{user.country || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.interests?.slice(0, 3).map(i => (
                            <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{i}</span>
                          ))}
                          {(user.interests?.length || 0) > 3 && (
                            <span className="text-xs text-muted-foreground">+{(user.interests?.length || 0) - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {user.last_activity_date || "Never"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">You</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.display_name || "this user"}</strong> and all their data (progress, achievements, friendships). They will no longer be able to sign in. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
