import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { 
  MessageCircle, Mail, Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowLeft, Calendar, User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SupportTicketActions } from "@/components/admin/support-ticket-actions";

export const metadata = {
  title: "Support Tickets — Admin",
};

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const resolvedSearchParams = await searchParams;
  const statusFilter = (resolvedSearchParams.status as TicketStatus) || "open";

  // Fetch tickets with filtering
  const tickets = await prisma.supportTicket.findMany({
    where: statusFilter === "open" 
      ? { status: statusFilter }
      : statusFilter 
      ? { status: statusFilter }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get ticket counts by status
  const statusCounts = await prisma.supportTicket.groupBy({
    by: ["status"],
    _count: true,
  });

  const counts: Record<string, number> = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };

  statusCounts.forEach(({ status, _count }) => {
    counts[status] = _count;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "in_progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "resolved":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "closed":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "closed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
                <p className="text-sm text-zinc-400 mt-1">
                  Manage student questions and support requests
                </p>
              </div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Link
              href="/admin/support"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                !statusFilter || statusFilter === "open"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              Open ({counts.open})
            </Link>
            <Link
              href="/admin/support?status=in_progress"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === "in_progress"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              In Progress ({counts.in_progress})
            </Link>
            <Link
              href="/admin/support?status=resolved"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === "resolved"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              Resolved ({counts.resolved})
            </Link>
            <Link
              href="/admin/support?status=closed"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === "closed"
                  ? "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              Closed ({counts.closed})
            </Link>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No {statusFilter} tickets
            </h3>
            <p className="text-zinc-400">
              {statusFilter === "open" 
                ? "Great! No pending support requests." 
                : `No tickets with status "${statusFilter}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {getStatusIcon(ticket.status)}
                        {ticket.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDistanceToNow(new Date(ticket.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 truncate">
                      {ticket.subject}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {ticket.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <a
                          href={`mailto:${ticket.email}`}
                          className="text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          {ticket.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <SupportTicketActions
                    ticketId={ticket.id}
                    currentStatus={ticket.status}
                    studentEmail={ticket.email}
                  />
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {ticket.message}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-3 text-xs text-zinc-500">
                  <span>Ticket ID: <code className="text-zinc-400">{ticket.id}</code></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
