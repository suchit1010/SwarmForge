/**
 * Ticket Tracking & Booking Hub Component
 * Visualizes flights, rail journeys, concert passes, and support tickets
 * with barcode/QR passes, status indicators, and 1-click Google Calendar sync.
 */

import React, { useEffect, useState } from "react";
import {
  Plane,
  Train,
  Ticket as TicketIcon,
  LifeBuoy,
  Plus,
  Calendar,
  MapPin,
  QrCode,
  CheckCircle2,
  Trash2,
  Search,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useTicketStore,
  type TicketItem,
  type TicketCategory,
} from "@/lib/gauntlet/ticket-store";
import { toast } from "sonner";

interface TicketManagerProps {
  onOpenVoice?: () => void;
}

export function TicketManager({ onOpenVoice }: TicketManagerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    tickets,
    filterCategory,
    setFilterCategory,
    addTicket,
    removeTicket,
    syncTicketToCalendar,
  } = useTicketStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  // New ticket form state
  const [category, setCategory] = useState<TicketCategory>("flight");
  const [title, setTitle] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [seat, setSeat] = useState("");
  const [gate, setGate] = useState("");
  const [price, setPrice] = useState("");
  const [passenger, setPassenger] = useState("Alex Mercer");
  const [notes, setNotes] = useState("");

  if (!mounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-neutral-900 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-neutral-900 rounded-2xl" />
          <div className="h-44 bg-neutral-900 rounded-2xl" />
          <div className="h-44 bg-neutral-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a ticket title");
      return;
    }

    const code = referenceCode.trim() || `${category.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    addTicket({
      category,
      title: title.trim(),
      referenceCode: code,
      origin: origin.trim() || undefined,
      destination: destination.trim() || undefined,
      departureTime: departureTime.trim() || "Upcoming",
      arrivalTime: arrivalTime.trim() || undefined,
      gate: gate.trim() || undefined,
      seat: seat.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
      currency: "USD",
      passengerOrAttendee: passenger.trim() || "Alex Mercer",
      status: "confirmed",
      notes: notes.trim() || undefined,
      qrPayload: `PASS:${code}:${origin || "ORIGIN"}:${destination || "DEST"}:${passenger}`,
    });

    toast.success(`Tracked ticket: ${title}`);
    setIsAddModalOpen(false);

    // Reset form
    setTitle("");
    setReferenceCode("");
    setOrigin("");
    setDestination("");
    setDepartureTime("");
    setArrivalTime("");
    setSeat("");
    setGate("");
    setPrice("");
    setNotes("");
  };

  const handleSyncCalendar = (id: string, title: string) => {
    syncTicketToCalendar(id);
    toast.success(`Synced "${title}" to Google Calendar holds!`);
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.referenceCode.toLowerCase().includes(q) ||
        (t.origin && t.origin.toLowerCase().includes(q)) ||
        (t.destination && t.destination.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getCategoryIcon = (cat: TicketCategory) => {
    switch (cat) {
      case "flight":
        return <Plane className="size-4 text-sky-400" />;
      case "train":
        return <Train className="size-4 text-emerald-400" />;
      case "event":
        return <TicketIcon className="size-4 text-amber-400" />;
      case "support":
        return <LifeBuoy className="size-4 text-purple-400" />;
      default:
        return <TicketIcon className="size-4 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Tickets", count: tickets.length },
            { id: "flight", label: "Flights", count: tickets.filter((t) => t.category === "flight").length },
            { id: "train", label: "Rail / Transit", count: tickets.filter((t) => t.category === "train").length },
            { id: "event", label: "Events & Shows", count: tickets.filter((t) => t.category === "event").length },
            { id: "support", label: "Support Tickets", count: tickets.filter((t) => t.category === "support").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id as TicketCategory | "all")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filterCategory === tab.id
                  ? "bg-neutral-800 text-white shadow-sm border border-neutral-700"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              {tab.label}
              <span className="text-[10px] opacity-60 font-mono">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {onOpenVoice && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenVoice}
              className="h-8 gap-1.5 border-sky-500/40 text-sky-300 hover:bg-sky-500/10 text-xs"
            >
              <Mic className="size-3" /> Voice Book
            </Button>
          )}

          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PNR, city, event..."
              className="h-8 pl-8 pr-3 text-xs w-44 bg-neutral-900 border-neutral-800 text-neutral-200 placeholder:text-neutral-600"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs"
          >
            <Plus className="size-3.5" /> Book / Track Ticket
          </Button>
        </div>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center bg-neutral-950/40 space-y-3">
          <TicketIcon className="size-8 text-neutral-600 mx-auto" />
          <div className="text-sm font-medium text-neutral-400">No tickets found in this filter</div>
          <p className="text-xs text-neutral-600 max-w-sm mx-auto">
            Book a new flight, rail pass, or concert ticket or tell the voice assistant: "Book a flight from SFO to JFK".
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 text-xs border-neutral-800 text-neutral-300"
          >
            <Plus className="size-3.5" /> Track New Ticket
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => {
            const isConfirmed = ticket.status === "confirmed";
            return (
              <div
                key={ticket.id}
                className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 transition-all overflow-hidden flex flex-col justify-between shadow-lg"
              >
                {/* Top Boarding Pass Header */}
                <div className="p-4 bg-gradient-to-b from-neutral-850 to-neutral-900 border-b border-neutral-800/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                        {getCategoryIcon(ticket.category)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-100 line-clamp-1">
                          {ticket.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-emerald-400 font-bold tracking-wider">
                            {ticket.referenceCode}
                          </span>
                          <span className="text-[10px] text-neutral-500">•</span>
                          <span className="text-[10px] text-neutral-400 capitalize">
                            {ticket.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono uppercase ${
                        isConfirmed
                          ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/30"
                          : "bg-amber-950/50 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                </div>

                {/* Middle Boarding Details */}
                <div className="p-4 space-y-3.5 flex-1">
                  {/* Origin to Destination Route */}
                  {(ticket.origin || ticket.destination) && (
                    <div className="flex items-center justify-between text-xs py-1">
                      <div className="space-y-0.5 max-w-[45%]">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">From</span>
                        <div className="font-semibold text-neutral-200 truncate">{ticket.origin || "Origin"}</div>
                      </div>
                      <div className="flex-1 flex items-center justify-center px-2">
                        <div className="w-full border-t border-dashed border-neutral-700 relative">
                          <div className="absolute left-1/2 -top-2 -translate-x-1/2 p-0.5 rounded-full bg-neutral-900 border border-neutral-700">
                            {ticket.category === "flight" ? (
                              <Plane className="size-2.5 text-neutral-400" />
                            ) : (
                              <MapPin className="size-2.5 text-neutral-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-0.5 text-right max-w-[45%]">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">To</span>
                        <div className="font-semibold text-neutral-200 truncate">{ticket.destination || "Destination"}</div>
                      </div>
                    </div>
                  )}

                  {/* Flight/Event Metadata pills */}
                  <div className="grid grid-cols-3 gap-2 bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/80 text-[11px]">
                    <div>
                      <div className="text-[9px] text-neutral-500 uppercase font-mono">Departure</div>
                      <div className="font-medium text-neutral-300 truncate mt-0.5">
                        {ticket.departureTime || "TBD"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-neutral-500 uppercase font-mono">Seat / Gate</div>
                      <div className="font-medium text-neutral-300 truncate mt-0.5">
                        {ticket.seat || ticket.gate || "Assigned"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-neutral-500 uppercase font-mono">Price</div>
                      <div className="font-bold text-emerald-400 font-mono truncate mt-0.5">
                        {ticket.price ? `$${ticket.price.toFixed(2)}` : "Included"}
                      </div>
                    </div>
                  </div>

                  {ticket.notes && (
                    <p className="text-[11px] text-neutral-400 italic line-clamp-2 bg-neutral-950/40 p-2 rounded-lg border border-neutral-800/50">
                      "{ticket.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Ticket Perforated Bar */}
                <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                    >
                      <QrCode className="size-3.5 text-neutral-400" />
                      <span>Pass Passcode</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSyncCalendar(ticket.id, ticket.title)}
                      className={`h-7 px-2.5 text-[11px] gap-1 rounded-lg ${
                        ticket.syncedToCalendar
                          ? "text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/60"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                      }`}
                    >
                      {ticket.syncedToCalendar ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-400" /> Synced
                        </>
                      ) : (
                        <>
                          <Calendar className="size-3" /> Sync Cal
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        removeTicket(ticket.id);
                        toast.success("Removed ticket");
                      }}
                      className="size-7 p-0 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Passcode Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-md bg-neutral-950 border border-neutral-800 text-neutral-100 p-6 text-center space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-white flex items-center justify-center gap-2">
                {getCategoryIcon(selectedTicket.category)}
                {selectedTicket.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Official Digital Boarding Pass / Ticket Voucher
              </DialogDescription>
            </DialogHeader>

            {/* Visual Boarding Pass Barcode */}
            <div className="rounded-2xl border border-neutral-800 bg-white p-5 text-neutral-950 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between text-xs border-b border-neutral-200 pb-2">
                <span className="font-bold uppercase tracking-wider">{selectedTicket.category}</span>
                <span className="font-mono font-bold text-neutral-700">{selectedTicket.referenceCode}</span>
              </div>

              <div className="text-center py-2">
                <div className="text-xs text-neutral-500 uppercase tracking-widest font-mono">PASSENGER / ATTENDEE</div>
                <div className="text-lg font-black text-neutral-900 tracking-tight">{selectedTicket.passengerOrAttendee}</div>
              </div>

              {/* Barcode simulation */}
              <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-300 flex flex-col items-center gap-1.5">
                <div className="flex justify-center items-center gap-1 h-12 w-full px-2">
                  {Array.from({ length: 44 }).map((_, i) => (
                    <div
                      key={i}
                      style={{ width: `${(i % 3) + 1.5}px` }}
                      className="h-full bg-neutral-950"
                    />
                  ))}
                </div>
                <div className="font-mono text-[10px] text-neutral-600 tracking-widest">
                  *{selectedTicket.referenceCode}*
                </div>
              </div>

              <div className="grid grid-cols-2 text-[11px] text-neutral-600 pt-1">
                <div>
                  <span className="font-semibold text-neutral-900">Seat:</span> {selectedTicket.seat || "Unassigned"}
                </div>
                <div>
                  <span className="font-semibold text-neutral-900">Gate:</span> {selectedTicket.gate || "TBD"}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setSelectedTicket(null)}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs"
            >
              Done
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* Book / Track New Ticket Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg bg-neutral-950 border border-neutral-800 text-neutral-100 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <TicketIcon className="size-4 text-emerald-400" />
              Book or Track Ticket
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Log flights, Amtrak trains, concert & conference passes, or support tickets.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-400">Ticket Type</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "flight", label: "Flight", icon: Plane },
                  { id: "train", label: "Train", icon: Train },
                  { id: "event", label: "Event", icon: TicketIcon },
                  { id: "support", label: "Support", icon: LifeBuoy },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id as TicketCategory)}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                        category === item.id
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & PNR */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-neutral-400">Title / Airline / Event</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. United UA 482 (SFO ➔ JFK)"
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">Confirmation / PNR</label>
                <Input
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="e.g. UA-8842"
                  className="bg-neutral-900 border-neutral-800 text-xs font-mono text-neutral-100"
                />
              </div>
            </div>

            {/* Route */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">Origin / Venue</label>
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. San Francisco (SFO)"
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">Destination</label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. New York (JFK)"
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
                />
              </div>
            </div>

            {/* Time & Seat */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">Departure Time</label>
                <Input
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  placeholder="Tomorrow, 08:30 AM"
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">Seat / Section</label>
                <Input
                  value={seat}
                  onChange={(e) => setSeat(e.target.value)}
                  placeholder="12A (Window)"
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">Price ($ USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="350.00"
                  className="bg-neutral-900 border-neutral-800 text-xs font-mono text-neutral-100"
                />
              </div>
            </div>

            {/* Passenger & Notes */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">Passenger / Attendee</label>
                <Input
                  value={passenger}
                  onChange={(e) => setPassenger(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">Notes / TSA Details</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="TSA PreCheck, carry-on..."
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs text-neutral-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs"
              >
                Save Ticket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
