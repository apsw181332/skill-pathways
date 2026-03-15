import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { DollarSign, Users, TrendingUp, CreditCard } from "lucide-react";

// Mock subscription data
const REVENUE_DATA = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: Math.floor(Math.random() * 500) + 200,
    subscribers: Math.floor(Math.random() * 10) + 2,
  };
});

const PLAN_DISTRIBUTION = [
  { name: "Free", value: 245, color: "hsl(225, 15%, 93%)" },
  { name: "Monthly", value: 89, color: "hsl(230, 58%, 48%)" },
  { name: "Annual", value: 42, color: "hsl(42, 70%, 62%)" },
];

const RECENT_TRANSACTIONS = [
  { id: 1, user: "Alex M.", plan: "Monthly", amount: 9.99, date: "Mar 14, 2026", status: "active" },
  { id: 2, user: "Jordan K.", plan: "Annual", amount: 79.99, date: "Mar 13, 2026", status: "active" },
  { id: 3, user: "Sam T.", plan: "Monthly", amount: 9.99, date: "Mar 12, 2026", status: "active" },
  { id: 4, user: "Riley B.", plan: "Monthly", amount: 9.99, date: "Mar 11, 2026", status: "cancelled" },
  { id: 5, user: "Casey W.", plan: "Annual", amount: 79.99, date: "Mar 10, 2026", status: "active" },
  { id: 6, user: "Morgan D.", plan: "Monthly", amount: 9.99, date: "Mar 9, 2026", status: "active" },
];

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

const AdminSubscriptions = () => {
  const totalRevenue = REVENUE_DATA.reduce((sum, d) => sum + d.revenue, 0);
  const totalSubs = PLAN_DISTRIBUTION.filter(p => p.name !== "Free").reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Monthly Revenue" value={`$${(totalRevenue / 30 * 30).toLocaleString()}`} color="bg-primary/10 text-primary" />
        <StatCard icon={Users} label="Active Subscribers" value={totalSubs.toString()} color="bg-accent/20 text-accent-foreground" />
        <StatCard icon={TrendingUp} label="Conversion Rate" value="34.8%" color="bg-primary/10 text-primary" />
        <StatCard icon={CreditCard} label="Avg Revenue/User" value="$12.40" color="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Curve (30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(230, 58%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(230, 58%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 12%, 87%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(225, 10%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(225, 10%, 50%)" tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(225, 12%, 87%)",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
                formatter={(value: number) => [`$${value}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(230, 58%, 48%)" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution pie */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={PLAN_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(0, 0%, 100%)"
              >
                {PLAN_DISTRIBUTION.map((entry, index) => (
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
            {PLAN_DISTRIBUTION.map((plan) => (
              <div key={plan.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: plan.color }} />
                  <span className="text-foreground">{plan.name}</span>
                </div>
                <span className="text-muted-foreground">{plan.value} users</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{tx.user}</td>
                  <td className="px-4 py-3 text-foreground">{tx.plan}</td>
                  <td className="px-4 py-3 text-foreground">${tx.amount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tx.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.status === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
