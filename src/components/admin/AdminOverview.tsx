import { useEffect, useState } from "react";
import { Users, BookOpen, TrendingUp, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

interface Stats {
  totalUsers: number;
  activeToday: number;
  totalLessons: number;
  avgStreak: number;
}

interface DailyDataPoint {
  date: string;
  signups: number;
  lessons: number;
  activeUsers: number;
}

const StatCard = ({ icon: Icon, label, value, trend, color }: {
  icon: any; label: string; value: string | number; trend?: string; color: string;
}) => (
  <div className="bg-card border border-border rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && <span className="text-xs font-medium text-primary">{trend}</span>}
    </div>
    <div className="text-2xl font-semibold text-foreground">{value}</div>
    <div className="text-sm text-muted-foreground mt-1">{label}</div>
  </div>
);

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeToday: 0, totalLessons: 0, avgStreak: 0 });
  const [dailyData, setDailyData] = useState<DailyDataPoint[]>([]);
  const [trends, setTrends] = useState({ users: "", active: "", lessons: "" });

  useEffect(() => {
    const fetchAll = async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: progress } = await supabase.from("user_progress").select("*");

      if (!profiles) return;

      const today = new Date().toISOString().split("T")[0];
      const activeToday = profiles.filter(p => p.last_activity_date === today).length;
      const avgStreak = profiles.length > 0
        ? Math.round(profiles.reduce((sum, p) => sum + (p.streak || 0), 0) / profiles.length)
        : 0;
      const totalLessons = progress?.filter(p => p.completed).length || 0;

      setStats({ totalUsers: profiles.length, activeToday, totalLessons, avgStreak });

      // Build real daily data from created_at timestamps
      const now = new Date();
      const days = 30;
      const dailyMap: Record<string, { signups: number; lessons: number; activeUsers: Set<string> }> = {};

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        dailyMap[key] = { signups: 0, lessons: 0, activeUsers: new Set() };
      }

      // Count signups per day
      profiles.forEach((p) => {
        const day = p.created_at.split("T")[0];
        if (dailyMap[day]) dailyMap[day].signups++;
      });

      // Count lessons completed per day and active users
      progress?.forEach((p) => {
        if (p.completed && p.completed_at) {
          const day = p.completed_at.split("T")[0];
          if (dailyMap[day]) {
            dailyMap[day].lessons++;
            dailyMap[day].activeUsers.add(p.user_id);
          }
        }
      });

      // Also count users with last_activity_date as active
      profiles.forEach((p) => {
        if (p.last_activity_date) {
          const day = p.last_activity_date;
          if (dailyMap[day]) dailyMap[day].activeUsers.add(p.user_id);
        }
      });

      const chartData: DailyDataPoint[] = Object.entries(dailyMap).map(([date, vals]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        signups: vals.signups,
        lessons: vals.lessons,
        activeUsers: vals.activeUsers.size,
      }));

      setDailyData(chartData);

      // Calculate trends (last 7 days vs previous 7 days)
      const last7 = chartData.slice(-7);
      const prev7 = chartData.slice(-14, -7);
      const sum = (arr: DailyDataPoint[], key: keyof DailyDataPoint) =>
        arr.reduce((s, d) => s + (d[key] as number), 0);

      const calcTrend = (key: keyof DailyDataPoint) => {
        const recent = sum(last7, key);
        const previous = sum(prev7, key);
        if (previous === 0) return recent > 0 ? "+100%" : "—";
        const pct = Math.round(((recent - previous) / previous) * 100);
        return pct >= 0 ? `+${pct}%` : `${pct}%`;
      };

      setTrends({
        users: calcTrend("signups"),
        active: calcTrend("activeUsers"),
        lessons: calcTrend("lessons"),
      });
    };

    fetchAll();

    // Realtime updates
    const channel = supabase
      .channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_progress" }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} trend={trends.users} color="bg-primary/10 text-primary" />
        <StatCard icon={TrendingUp} label="Active Today" value={stats.activeToday} trend={trends.active} color="bg-accent/20 text-accent-foreground" />
        <StatCard icon={BookOpen} label="Lessons Completed" value={stats.totalLessons} trend={trends.lessons} color="bg-primary/10 text-primary" />
        <StatCard icon={Flame} label="Avg. Streak" value={`${stats.avgStreak} days`} color="bg-destructive/10 text-destructive" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">User Signups (30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(230, 58%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(230, 58%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 12%, 87%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(225, 10%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(225, 10%, 50%)" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(225, 12%, 87%)",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
              />
              <Area type="monotone" dataKey="signups" stroke="hsl(230, 58%, 48%)" fill="url(#signupGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Daily Lessons Completed</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 12%, 87%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(225, 10%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(225, 10%, 50%)" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(225, 12%, 87%)",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
              />
              <Bar dataKey="lessons" fill="hsl(42, 70%, 62%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">Active Users Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(42, 70%, 62%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(42, 70%, 62%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 12%, 87%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(225, 10%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(225, 10%, 50%)" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(225, 12%, 87%)",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
              />
              <Area type="monotone" dataKey="activeUsers" stroke="hsl(42, 70%, 62%)" fill="url(#activeGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
