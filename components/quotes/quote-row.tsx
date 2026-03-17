import { Quote, Contact, QuoteStatus } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface QuoteRowProps {
  quote: Quote & { contact: Contact };
}

export function QuoteRow({ quote }: QuoteRowProps) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted/50">
      <TableCell className="font-medium">
        <Link href={`/quotes/${quote.id}`} className="block">
          {quote.contact.firstName} {quote.contact.lastName}
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/quotes/${quote.id}`} className="block">
          {quote.title}
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/quotes/${quote.id}`} className="block">
          ${Number(quote.amount).toLocaleString()}
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/quotes/${quote.id}`} className="block">
          {format(new Date(quote.sentAt), "MMM d, h:mm a")}
        </Link>
      </TableCell>
      <TableCell>
        <StatusBadge status={quote.status} />
      </TableCell>
    </TableRow>
  );
}

const statusConfig: Record<QuoteStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-slate-100 text-slate-700" },
  sequence_running: { label: "Following Up", className: "bg-blue-100 text-blue-700" },
  engaged: { label: "Replied", className: "bg-amber-100 text-amber-700" },
  converted: { label: "Won", className: "bg-emerald-100 text-emerald-700" },
  expired: { label: "Expired", className: "bg-slate-100 text-slate-500" },
  excluded: { label: "Stopped", className: "bg-slate-100 text-slate-500" },
  dnc: { label: "Opted Out", className: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const config = statusConfig[status];
  return (
    <Badge className={cn("font-medium shadow-none", config.className)}>
      {config.label}
    </Badge>
  );
}
