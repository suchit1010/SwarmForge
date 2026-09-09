/**
 * Google Docs & Drive Real Artifact Exporter Modal
 * Generates formatted Google Docs payloads, Drive folder structures,
 * and high-fidelity Markdown / HTML / PDF-ready documents with 1-click downloads.
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Copy,
  Download,
  Check,
} from "lucide-react";
import { GoogleDocsExporter, type GoogleDocExportPayload } from "@/lib/gauntlet/docs-exporter";
import { useGauntlet } from "@/lib/gauntlet/store";
import { useHabitStore } from "@/lib/gauntlet/habit-store";
import { useTicketStore } from "@/lib/gauntlet/ticket-store";
import { useBriefingStore } from "@/lib/gauntlet/briefing-store";
import { toast } from "sonner";

interface DocsExportModalProps {
  open: boolean;
  onClose: () => void;
  missionId?: string;
}

export function DocsExportModal({ open, onClose, missionId }: DocsExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"gdoc" | "daily">("daily");

  const habitLog = useHabitStore((s) => s.getTodayLog());
  const tickets = useTicketStore((s) => s.tickets);
  const briefing = useBriefingStore((s) => s.currentBriefing);
  const missions = useGauntlet((s) => s.missions);

  const targetMission = missionId
    ? missions[missionId]
    : Object.values(missions)[0];

  let payload: GoogleDocExportPayload;

  if (selectedFormat === "daily" || !targetMission) {
    payload = GoogleDocsExporter.exportDailyLog(habitLog, tickets, briefing);
  } else {
    payload = GoogleDocsExporter.exportMission(targetMission);
  }

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(payload.markdownContent);
    setCopied(true);
    toast.success("Document copied to clipboard! Ready to paste in Google Docs / Notion.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const filename = `${payload.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.md`;
    GoogleDocsExporter.downloadAsFile(filename, payload.markdownContent, "text/markdown");
    toast.success(`Downloaded ${filename}`);
  };

  const handleDownloadHtml = () => {
    const filename = `${payload.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.html`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${payload.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; }
    h1 { border-bottom: 2px solid #eaeaea; padding-bottom: 10px; }
    h2 { margin-top: 30px; color: #2d3748; }
    pre { background: #f7fafc; padding: 15px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #10b981; padding-left: 15px; color: #4a5568; font-style: italic; }
    hr { border: 0; height: 1px; background: #e2e8f0; margin: 30px 0; }
  </style>
</head>
<body>
  <pre>${payload.markdownContent}</pre>
</body>
</html>
    `;
    GoogleDocsExporter.downloadAsFile(filename, html, "text/html");
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-neutral-950 border border-neutral-800 text-neutral-100 p-0 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-blue-950/40 via-neutral-900 to-neutral-950 border-b border-neutral-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FileText className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  Google Docs & Drive Real Artifact Exporter
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400">
                  Export formatted deliverables directly for Google Workspace, Notion & Google Drive folders.
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/30 font-mono">
              DRIVE COMPATIBLE
            </Badge>
          </div>

          {/* Tab Selector */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setSelectedFormat("daily")}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                selectedFormat === "daily"
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Daily Executive Digest & Travel
            </button>
            {targetMission && (
              <button
                onClick={() => setSelectedFormat("gdoc")}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  selectedFormat === "gdoc"
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Gauntlet Mission Deliverable
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Metadata Card */}
          <div className="flex items-center justify-between bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-neutral-500 uppercase font-mono">Document Title</span>
              <div className="font-semibold text-neutral-200">{payload.title}</div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-neutral-500 uppercase font-mono">Target Folder</span>
              <div className="font-mono text-blue-400">Google Drive / {payload.folderName}</div>
            </div>
          </div>

          {/* Live Document Preview Box */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 max-h-64 overflow-y-auto space-y-2 font-mono text-xs text-neutral-300">
            <pre className="whitespace-pre-wrap leading-relaxed font-sans text-xs">
              {payload.markdownContent}
            </pre>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyClipboard}
                className="gap-1.5 text-xs border-neutral-800 text-neutral-200 hover:bg-neutral-900"
              >
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copied ? "Copied to Clipboard!" : "Copy for Docs / Notion"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadHtml}
                className="gap-1.5 text-xs border-neutral-800 text-neutral-300 hover:bg-neutral-900"
              >
                <Download className="size-3.5" /> HTML
              </Button>

              <Button
                size="sm"
                onClick={handleDownloadMd}
                className="gap-1.5 text-xs bg-blue-500 hover:bg-blue-400 text-neutral-950 font-bold"
              >
                <Download className="size-3.5" /> Download .md
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
