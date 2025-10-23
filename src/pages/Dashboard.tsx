import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Users, CheckCircle2, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: number;
  status: "pending" | "paid" | "cancelled" | "expired";
  description: string;
  created_at: string;
}

interface Profile {
  funds_available: number;
  is_verified: boolean;
  full_name: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalReceived: 0,
    pendingAmount: 0,
    verifiedRecipients: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    await Promise.all([
      fetchProfile(session.user.id),
      fetchPayments(session.user.id),
      fetchStats(session.user.id),
    ]);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      toast.error("Error fetching profile");
    } else {
      setProfile(data);
    }
  };

  const fetchPayments = async (userId: string) => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      toast.error("Error fetching payments");
    } else {
      setPayments((data || []) as Payment[]);
    }
  };

  const fetchStats = async (userId: string) => {
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("amount, status")
      .eq("user_id", userId);

    const { data: recipientsData } = await supabase
      .from("verified_recipients")
      .select("id")
      .eq("user_id", userId)
      .eq("verification_status", "verified");

    if (paymentsData) {
      const totalReceived = paymentsData
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const pendingAmount = paymentsData
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + Number(p.amount), 0);

      setStats({
        totalReceived,
        pendingAmount,
        verifiedRecipients: recipientsData?.length || 0,
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!</h1>
            <p className="text-muted-foreground mt-1">Here's your payment overview</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Funds Available</p>
              <p className="text-2xl font-bold">${profile?.funds_available.toFixed(2) || "0.00"}</p>
            </div>
            {profile?.is_verified && <StatusBadge status="verified" />}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatsCard
            title="Total Received"
            value={`$${stats.totalReceived.toFixed(2)}`}
            icon={DollarSign}
            subtitle="All-time payments"
          />
          <StatsCard
            title="Pending Payments"
            value={`$${stats.pendingAmount.toFixed(2)}`}
            icon={TrendingUp}
            subtitle="Awaiting payment"
          />
          <StatsCard
            title="Verified Recipients"
            value={stats.verifiedRecipients.toString()}
            icon={Users}
            subtitle="Trusted payees"
          />
        </div>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payment Requests</CardTitle>
            <Link to="/request-to-pay">
              <Button className="gap-2">
                <Send className="w-4 h-4" />
                New Request
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payment requests yet</p>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold">${payment.amount.toFixed(2)}</p>
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
