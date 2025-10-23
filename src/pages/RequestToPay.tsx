import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

const RequestToPay = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    invoiceNumber: "",
    dueDate: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to continue");
      navigate("/auth");
      return;
    }

    const { error } = await supabase.from("payments").insert({
      user_id: session.user.id,
      amount: parseFloat(formData.amount),
      description: formData.description,
      invoice_number: formData.invoiceNumber || null,
      due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      status: "pending",
    });

    if (error) {
      toast.error("Error creating payment request: " + error.message);
    } else {
      toast.success("Payment request created successfully!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Request Payment</CardTitle>
            <CardDescription>Create a new payment request with invoice details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="100.00"
                  value={formData.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Services rendered for project X..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  type="text"
                  placeholder="INV-2024-001"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleChange("invoiceNumber", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                <Send className="w-4 h-4" />
                {loading ? "Creating..." : "Send Payment Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestToPay;
