import { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getLevelForXp } from "@/lib/levels";

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

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setUsers(data as UserProfile[]);
      setLoading(false);
    };
    fetchUsers();
  }, []);

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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
