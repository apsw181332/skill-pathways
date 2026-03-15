import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { DollarSign, Users, TrendingUp, CreditCard, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLevelForXp } from "@/lib/levels";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="bg-card border border-border rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="text-2xl font-semibold text-foreground">{value}</div>
    <div className="text-sm text-muted-foreground mt-1">{label}</div>
  </div>
);

interface UserActivity {
  display_name: string;
  xp: number;
  streak: number;
  lessonsCompleted: number;
  lastActive: string;
  level: string;
}

const AdminSubscriptions = () => {
  const [topUsers, setTopUsers] = useState<UserActivity[]>([]);
  const [levelDistribution, setLevelDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [xpOverTime, setXpOverTime] = useState<{ date: string; totalXp: number; avgXp: number }[]>([]);
  const [totals, setTotals] = useState({ totalXp: 0, totalLessons: 0, avgLevel: "", topStreak: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: progress } = await supabase.from("user_progress").select("*");

      if (!profiles) return;

      // Total stats
      const totalXp = profiles.reduce((sum, p) => sum + p.xp, 0);
      const totalLessons = progress?.filter(p => p.completed).length || 0;
      const topStreak = Math.max(...profiles.map(p => p.streak), 0);
      const avgLevelNum = profiles.length > 0
        ? Math.round(profiles.reduce((sum, p) => sum + (getLevelForXp(p.xp).level), 0) / profiles.length)
        : 1;
      const avgLevelInfo = getLevelForXp(avgLevelNum * 100); // approximate

      setTotals({
        totalXp,
        totalLessons,
        avgLevel: `${avgLevelInfo.emoji} Lv.${avgLevelInfo.level}`,
        topStreak,
      });

      // Lessons per user
      const userLessons: Record<string, number> = {};
      progress?.forEach(p => {
        if (p.completed) {
          userLessons[p.user_id] = (userLessons[p.user_id] || 0) + 1;
        }
      });

      // Top users by XP
      const sorted = [...profiles].sort((a, b) => b.xp - a.xp).slice(0, 10);
      setTopUsers(sorted.map(p => ({
        display_name: p.display_name || "Anonymous",
        xp: p.xp,
        streak: p.streak,
        lessonsCompleted: userLessons[p.user_id] || 0,
        lastActive: p.last_activity_date || "Never",
        level: `${getLevelForXp(p.xp).emoji} Lv.${getLevelForXp(p.xp).level}`,
      })));

      // Level distribution
      const levelCounts: Record<number, number> = {};
      profiles.forEach(p => {
        const lvl = getLevelForXp(p.xp).level;
        levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
      });
      const colors = [
        "hsl(225, 15%, 85%)", "hsl(230, 58%, 70%)", "hsl(230, 58%, 58%)",
        "hsl(230, 58%, 48%)", "hsl(42, 70%, 72%)", "hsl(42, 70%, 62%)",
        "hsl(42, 70%, 52%)", "hsl(0, 60%, 55%)",
      ];
      setLevelDistribution(
        Object.entries(levelCounts).map(([lvl, count]) => ({
          name: `Level ${lvl}`,
          value: count,
          color: colors[parseInt(lvl) - 1] || colors[0],
        }))
      );

      // XP accumulation over time (from progress completed_at)
      const now = new Date();
      const days = 30;
      const xpByDay: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        xpByDay[d.toISOString().split("T")[0]] = 0;
      }
      progress?.forEach(p => {
        if (p.completed && p.completed_at) {
          const day = p.completed_at.split("T")[0];
          if (xpByDay[day] !== undefined) {
            xpByDay[day] += p.score || 50; // use score or default 50xp per lesson
          }
        }
      });

      let cumulative = 0;
      const xpChart = Object.entries(xpByDay).map(([date, xp]) => {
        cumulative += xp;
        return {
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          totalXp: cumulative,
          avgXp: xp,
        };
      });
      setXpOverTime(xpChart);
    };

    fetchData();

    // Realtime
    const channel = supabase
      .channel("admin-subs")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_progress" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total XP Earned" value={totals.totalXp.toLocaleString()} color="bg-primary/10 text-primary" />
        <StatCard icon={BookOpen} label="Lessons Completed" value={totals.totalLessons.toString()} color="bg-accent/20 text-accent-foreground" />
        <StatCard icon={Users} label="Avg. Level" value={totals.avgLevel} color="bg-primary/10 text-primary" />
        <StatCard icon={CreditCard} label="Top Streak" value={`${totals.topStreak} days 🔥`} color="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* XP curve */}
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">XP Earned (30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={xpOverTime}>
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(230, 58%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(230, 58%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 12%, 87%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(225, 10%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(225, 10%, 50%)" />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(225, 12%, 87%)",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === "totalXp" ? "Cumulative XP" : "Daily XP",
                ]}
              />
              <Area type="monotone" dataKey="totalXp" stroke="hsl(230, 58%, 48%)" fill="url(#xpGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Level distribution pie */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Level Distribution</h3>
          {levelDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={levelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(0, 0%, 100%)"
                  >
                    {levelDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(225, 12%, 87%)",
                      borderRadius: "8px",
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {levelDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                      <span className="text-foreground">{item.name}</span>
                    </div>
                    <span className="text-muted-foreground">{item.value} users</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">No users yet</p>
          )}
        </div>
      </div>

      {/* Top users table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Top Users by XP</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Level</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">XP</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Streak</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lessons</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users yet</td></tr>
              ) : (
                topUsers.map((u, i) => (
                  <tr key={i} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{u.display_name}</td>
                    <td className="px-4 py-3 text-foreground">{u.level}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{u.xp.toLocaleString()}</td>
                    <td className="px-4 py-3 text-foreground">{u.streak} 🔥</td>
                    <td className="px-4 py-3 text-foreground">{u.lessonsCompleted}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{u.lastActive}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
