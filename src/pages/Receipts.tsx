import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";

interface Receipt {
  id: string;
  receipt_number: string;
  amount: number;
  transaction_date: string;
  payment_method: string | null;
  notes: string | null;
}

const Receipts = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await fetchReceipts(session.user.id);
    setLoading(false);
  };

  const fetchReceipts = async (userId: string) => {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false });

    if (error) {
      toast.error("Error fetching receipts");
    } else {
      setReceipts(data || []);
    }
  };

  const downloadReceipt = (receipt: Receipt) => {
    // Simple text-based receipt
    const content = `
RTP PORTAL - OFFICIAL RECEIPT
================================

Receipt #: ${receipt.receipt_number}
Date: ${new Date(receipt.transaction_date).toLocaleDateString()}
Amount: $${receipt.amount.toFixed(2)}
Payment Method: ${receipt.payment_method || "N/A"}

${receipt.notes ? `Notes: ${receipt.notes}` : ""}

================================
Thank you for your payment!
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${receipt.receipt_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Digital Receipts
            </CardTitle>
            <CardDescription>View and download your payment receipts</CardDescription>
          </CardHeader>
          <CardContent>
            {receipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No receipts available</p>
            ) : (
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">Receipt #{receipt.receipt_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(receipt.transaction_date).toLocaleDateString()} •{" "}
                        {receipt.payment_method || "Payment received"}
                      </p>
                      {receipt.notes && (
                        <p className="text-sm text-muted-foreground">{receipt.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold">${receipt.amount.toFixed(2)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReceipt(receipt)}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
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

export default Receipts;
