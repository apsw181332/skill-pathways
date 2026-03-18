import { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp, Trash2, Plus, Minus, Info } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getLevelForXp } from "@/lib/levels";
import { decodeLearningCode, LEARNING_CODE_CRITERIA } from "@/lib/learningCode";
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
  learning_code: string | null;
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
  const [xpTarget, setXpTarget] = useState<UserProfile | null>(null);
  const [xpAmount, setXpAmount] = useState(100);
  const [xpLoading, setXpLoading] = useState(false);
  const [learningCodeUser, setLearningCodeUser] = useState<UserProfile | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setUsers(data as UserProfile[]);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      fetchUsers();
    };
    init();

    const channel = supabase
      .channel("admin-users-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchUsers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  const handleXpAction = async (action: "add" | "remove") => {
    if (!xpTarget || xpAmount <= 0) return;
    setXpLoading(true);

    const { data, error } = await supabase.functions.invoke("admin-manage-xp", {
      body: { user_id: xpTarget.user_id, action, amount: xpAmount },
    });

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to update XP");
    } else {
      toast.success(`${action === "add" ? "Added" : "Removed"} ${xpAmount} XP ${action === "add" ? "to" : "from"} ${xpTarget.display_name || "user"}`);
      setUsers(prev => prev.map(u =>
        u.id === xpTarget.id ? { ...u, xp: data.xp } : u
      ));
    }

    setXpLoading(false);
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
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowLegend(!showLegend)} className="gap-1">
          <Info className="w-3.5 h-3.5" /> Learning Code Legend
        </Button>
        <span className="text-sm text-muted-foreground">{filtered.length} users</span>
      </div>

      {showLegend && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Learning Code Legend (9 digits)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {LEARNING_CODE_CRITERIA.map((c, i) => (
              <div key={i} className="flex items-start gap-2 bg-secondary/50 rounded-lg p-2">
                <span className="font-mono font-bold text-primary">Pos {c.position}</span>
                <div>
                  <span className="font-medium text-foreground">{c.name}</span>
                  <div className="text-muted-foreground">
                    0={c.levels[0]}, 1={c.levels[1]}, 2={c.levels[2]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("display_name")} className="flex items-center gap-1">User <SortIcon col="display_name" /></button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("xp")} className="flex items-center gap-1">XP <SortIcon col="xp" /></button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("streak")} className="flex items-center gap-1">Streak <SortIcon col="streak" /></button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Country</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Learning Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button onClick={() => handleSort("created_at")} className="flex items-center gap-1">Joined <SortIcon col="created_at" /></button>
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
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
                        <span className="inline-flex items-center gap-1 text-foreground">{lvl.emoji} Lv.{lvl.level}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">{user.xp.toLocaleString()}</td>
                      <td className="px-4 py-3 text-foreground">{user.streak} 🔥</td>
                      <td className="px-4 py-3 text-foreground">{user.country || "—"}</td>
                      <td className="px-4 py-3">
                        {user.learning_code ? (
                          <button
                            onClick={() => setLearningCodeUser(user)}
                            className="font-mono text-xs bg-secondary px-2 py-1 rounded text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Click to view decoded learning profile"
                          >
                            {user.learning_code}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {isSelf ? (
                            <span className="text-xs text-muted-foreground">You</span>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => { setXpTarget(user); setXpAmount(100); }} title="Manage XP">
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteTarget(user)} title="Delete user">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.display_name || "this user"}</strong> and all their data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* XP Management dialog */}
      <Dialog open={!!xpTarget} onOpenChange={(open) => !open && setXpTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage XP — {xpTarget?.display_name || "User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Current XP</p>
              <p className="text-3xl font-bold text-foreground">{xpTarget?.xp.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{xpTarget && getLevelForXp(xpTarget.xp).emoji} Level {xpTarget && getLevelForXp(xpTarget.xp).level}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Amount</label>
              <Input type="number" min={1} value={xpAmount} onChange={e => setXpAmount(Math.max(1, parseInt(e.target.value) || 0))} />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button onClick={() => handleXpAction("remove")} disabled={xpLoading} variant="outline" className="flex-1 gap-1 text-destructive">
              <Minus className="w-4 h-4" /> Remove {xpAmount} XP
            </Button>
            <Button onClick={() => handleXpAction("add")} disabled={xpLoading} className="flex-1 gap-1">
              <Plus className="w-4 h-4" /> Add {xpAmount} XP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Learning Code Dialog */}
      <Dialog open={!!learningCodeUser} onOpenChange={(open) => !open && setLearningCodeUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Learning Profile — {learningCodeUser?.display_name || "User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Learning Code</p>
              <p className="text-3xl font-mono font-bold text-primary tracking-widest">{learningCodeUser?.learning_code || "—"}</p>
            </div>
            {learningCodeUser?.learning_code && (
              <div className="space-y-2">
                {decodeLearningCode(learningCodeUser.learning_code).map((item, i) => {
                  const adaptation = ADAPTATION_EFFECTS[item.name]?.[item.value];
                  return (
                    <div key={i} className="bg-secondary/50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[0, 1, 2].map(v => (
                              <div key={v} className={`w-3 h-3 rounded-full ${v <= item.value ? "bg-primary" : "bg-border"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground w-20 text-right">{item.label}</span>
                        </div>
                      </div>
                      {adaptation && (
                        <p className="text-[11px] text-primary/80 mt-1 leading-snug">
                          ⚙️ {adaptation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
