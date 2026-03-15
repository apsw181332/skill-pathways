import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Globe2, CreditCard, LogOut,
  TrendingUp, UserCheck, BookOpen, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminGlobe from "./AdminGlobe";
import AdminSubscriptions from "./AdminSubscriptions";
import mascotImg from "@/assets/mascot-penguin.png";

interface AdminDashboardProps {
  onSignOut: () => Promise<void>;
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "globe", label: "Globe", icon: Globe2 },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
] as const;

type TabId = (typeof NAV_ITEMS)[number]["id"];

const AdminDashboard = ({ onSignOut }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={mascotImg} alt="Pathways" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="font-semibold text-foreground text-lg tracking-tight">Pathways</h1>
              <span className="text-xs text-muted-foreground font-medium">Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-4">
          <h2 className="text-xl font-semibold text-foreground capitalize">{activeTab}</h2>
        </header>

        <div className="p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && <AdminOverview />}
            {activeTab === "users" && <AdminUsers />}
            {activeTab === "globe" && <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Loading globe...</div>}><AdminGlobe /></Suspense>}
            {activeTab === "subscriptions" && <AdminSubscriptions />}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
