import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "paid" | "verified" | "cancelled" | "expired" | "rejected";
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const variants = {
    pending: {
      icon: Clock,
      label: "Pending",
      variant: "secondary" as const,
    },
    paid: {
      icon: CheckCircle2,
      label: "Paid",
      className: "bg-success text-success-foreground",
    },
    verified: {
      icon: CheckCircle2,
      label: "Verified",
      className: "bg-success text-success-foreground",
    },
    cancelled: {
      icon: XCircle,
      label: "Cancelled",
      variant: "destructive" as const,
    },
    expired: {
      icon: AlertCircle,
      label: "Expired",
      className: "bg-warning text-warning-foreground",
    },
    rejected: {
      icon: XCircle,
      label: "Rejected",
      variant: "destructive" as const,
    },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={"variant" in config ? config.variant : undefined}
      className={`${"className" in config ? config.className : ""} ${className || ""} flex items-center gap-1.5 px-3 py-1`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
};
