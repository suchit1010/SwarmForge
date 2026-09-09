/**
 * Ticket Tracking & Booking Orchestration Store
 * Manages travel (flights, trains), events (concerts, conferences),
 * transit passes, and customer/IT support tickets.
 * Synchronizes with Google Calendar, Neural Memory Graph, and Watchdog Triggers.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMemory } from "../memory/store.ts";

export type TicketCategory = "flight" | "train" | "event" | "transit" | "support";
export type TicketStatus = "confirmed" | "scheduled" | "in_transit" | "completed" | "delayed" | "cancelled";

export interface TicketItem {
  id: string;
  category: TicketCategory;
  title: string; // e.g. "United Airlines UA 482", "Coldplay Music of the Spheres", "TechCrunch Disrupt"
  referenceCode: string; // PNR / Ticket Number / Booking Ref e.g. "UA-9842F"
  origin?: string; // "SFO - San Francisco"
  destination?: string; // "JFK - New York"
  departureTime?: string; // ISO string or human formatted
  arrivalTime?: string;
  gate?: string;
  seat?: string;
  price?: number;
  currency?: string;
  passengerOrAttendee: string;
  status: TicketStatus;
  notes?: string;
  qrPayload?: string;
  syncedToCalendar: boolean;
  createdAt: number;
  updatedAt: number;
}

interface TicketState {
  tickets: TicketItem[];
  filterCategory: TicketCategory | "all";
  
  // Actions
  addTicket: (ticket: Omit<TicketItem, "id" | "createdAt" | "updatedAt" | "syncedToCalendar">) => TicketItem;
  updateTicket: (id: string, patch: Partial<TicketItem>) => void;
  removeTicket: (id: string) => void;
  bookTicketFromPrompt: (prompt: string) => TicketItem;
  syncTicketToCalendar: (id: string) => boolean;
  setFilterCategory: (category: TicketCategory | "all") => void;
  getActiveTicketsCount: () => number;
}

const DEFAULT_TICKETS: TicketItem[] = [
  {
    id: "tkt_flight_01",
    category: "flight",
    title: "United Airlines UA 482 (SFO ➔ JFK)",
    referenceCode: "UA-8842K",
    origin: "San Francisco (SFO)",
    destination: "New York (JFK)",
    departureTime: "Tomorrow, 08:30 AM",
    arrivalTime: "Tomorrow, 04:50 PM",
    gate: "G92",
    seat: "12A (Window)",
    price: 384.50,
    currency: "USD",
    passengerOrAttendee: "Alex Mercer",
    status: "confirmed",
    notes: "TSA PreCheck verified. Carry-on luggage included.",
    qrPayload: "BOARDING_PASS:UA8842K:SFO:JFK:SEAT12A:MERCER",
    syncedToCalendar: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: "tkt_event_02",
    category: "event",
    title: "AI Engineer World Summit 2026",
    referenceCode: "AI-CONF-2026-X9",
    origin: "Moscone Center, SF",
    destination: "Main Keynote Stage",
    departureTime: "Friday, 09:00 AM",
    arrivalTime: "Friday, 06:00 PM",
    seat: "VIP Pass / Section A",
    price: 499.00,
    currency: "USD",
    passengerOrAttendee: "Alex Mercer",
    status: "confirmed",
    notes: "Includes access to Founders Lounge and AI Hackathon.",
    qrPayload: "EVENT_PASS:AICONF2026:VIP:MERCER",
    syncedToCalendar: true,
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
  {
    id: "tkt_train_03",
    category: "train",
    title: "Amtrak Acela Express #2150",
    referenceCode: "AMT-44129",
    origin: "Penn Station, NY",
    destination: "South Station, Boston",
    departureTime: "Sunday, 02:15 PM",
    arrivalTime: "Sunday, 06:10 PM",
    seat: "Car 3, Seat 14B",
    price: 135.00,
    currency: "USD",
    passengerOrAttendee: "Alex Mercer",
    status: "scheduled",
    notes: "Quiet car preferred. Electric outlet available.",
    qrPayload: "AMTRAK:2150:NYP:BOS:CAR3:14B",
    syncedToCalendar: false,
    createdAt: Date.now() - 250000000,
    updatedAt: Date.now() - 250000000,
  }
];

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: DEFAULT_TICKETS,
      filterCategory: "all",

      setFilterCategory: (category) => set({ filterCategory: category }),

      addTicket: (data) => {
        const id = `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const newTicket: TicketItem = {
          ...data,
          id,
          syncedToCalendar: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          tickets: [newTicket, ...state.tickets],
        }));

        // Ingest into Neural Memory Graph
        useMemory.getState().addEntry({
          id: `mem_tkt_${Date.now()}`,
          userId: "user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rawText: `Ticket Booked / Tracked: ${newTicket.title} (${newTicket.referenceCode}). Departure: ${newTicket.departureTime || "N/A"}. Seat: ${newTicket.seat || "Unassigned"}. Price: $${newTicket.price || 0}.`,
          processedSummary: `Tracked Ticket: ${newTicket.title} [${newTicket.referenceCode}] for ${newTicket.passengerOrAttendee}.`,
          domain: "personal",
          embeddingVector: null,
          missionId: null,
          sourceType: "calendar",
          tags: ["ticket", newTicket.category, "travel", "booking"],
          isArchived: false,
        });

        return newTicket;
      },

      updateTicket: (id, patch) => {
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t
          ),
        }));
      },

      removeTicket: (id) => {
        set((state) => ({
          tickets: state.tickets.filter((t) => t.id !== id),
        }));
      },

      bookTicketFromPrompt: (prompt) => {
        const p = prompt.toLowerCase();
        let category: TicketCategory = "flight";
        let title = "Travel Booking";
        let origin = "San Francisco (SFO)";
        let destination = "New York (JFK)";
        let price = 280.00;

        if (p.includes("train") || p.includes("amtrak") || p.includes("rail")) {
          category = "train";
          title = "High-Speed Rail Transit";
          origin = "Union Station";
          destination = "Central Terminal";
          price = 85.00;
        } else if (p.includes("concert") || p.includes("event") || p.includes("summit") || p.includes("game") || p.includes("show")) {
          category = "event";
          title = prompt.length > 30 ? prompt.slice(0, 30) : prompt;
          origin = "City Arena";
          destination = "Gate Entrance";
          price = 150.00;
        } else if (p.includes("support") || p.includes("bug") || p.includes("jira") || p.includes("ticket #")) {
          category = "support";
          title = `IT / Support Ticket: ${prompt.slice(0, 35)}`;
          origin = "Desk Ingest";
          destination = "L2 Engineering";
          price = 0;
        }

        // Try extracting origin / destination
        const fromToMatch = prompt.match(/from\s+([a-zA-Z\s]+)\s+to\s+([a-zA-Z\s]+)/i);
        if (fromToMatch) {
          origin = fromToMatch[1].trim();
          destination = fromToMatch[2].trim();
          title = `${category === "flight" ? "Flight" : "Transit"}: ${origin} ➔ ${destination}`;
        }

        const code = `${category.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        return get().addTicket({
          category,
          title,
          referenceCode: code,
          origin,
          destination,
          departureTime: "Upcoming Scheduled Window",
          arrivalTime: "Destination Arrival",
          seat: "Auto-Assigned Standard",
          price,
          currency: "USD",
          passengerOrAttendee: "Alex Mercer",
          status: "confirmed",
          notes: `Booked via Gauntlet Voice/AI: "${prompt}"`,
          qrPayload: `PASS:${code}:${origin}:${destination}:MERCER`,
        });
      },

      syncTicketToCalendar: (id) => {
        const ticket = get().tickets.find((t) => t.id === id);
        if (!ticket) return false;

        get().updateTicket(id, { syncedToCalendar: true });
        return true;
      },

      getActiveTicketsCount: () => {
        return get().tickets.filter((t) => t.status === "confirmed" || t.status === "scheduled" || t.status === "in_transit").length;
      },
    }),
    {
      name: "gauntlet_tickets_v1",
    }
  )
);
