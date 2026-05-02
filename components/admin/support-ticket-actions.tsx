"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MoreVertical, Clock, CheckCircle2, XCircle, Mail, Trash2
} from "lucide-react";

interface SupportTicketActionsProps {
  ticketId: string;
  currentStatus: string;
  studentEmail: string;
}

export function SupportTicketActions({
  ticketId,
  currentStatus,
  studentEmail,
}: SupportTicketActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/support/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      router.refresh();
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/support/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      if (!response.ok) throw new Error("Failed to delete ticket");

      router.refresh();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      alert("Failed to delete ticket");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-1">
            {/* Reply via Email */}
            <a
              href={`mailto:${studentEmail}`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Mail className="w-4 h-4" />
              Reply via Email
            </a>

            <div className="h-px bg-zinc-800 my-1" />

            {/* Status Updates */}
            {currentStatus !== "in_progress" && (
              <button
                onClick={() => handleStatusUpdate("in_progress")}
                disabled={isUpdating}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Clock className="w-4 h-4 text-blue-400" />
                Mark In Progress
              </button>
            )}

            {currentStatus !== "resolved" && (
              <button
                onClick={() => handleStatusUpdate("resolved")}
                disabled={isUpdating}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                Mark Resolved
              </button>
            )}

            {currentStatus !== "closed" && (
              <button
                onClick={() => handleStatusUpdate("closed")}
                disabled={isUpdating}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-zinc-400" />
                Mark Closed
              </button>
            )}

            <div className="h-px bg-zinc-800 my-1" />

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Ticket
            </button>
          </div>
        </>
      )}
    </div>
  );
}
