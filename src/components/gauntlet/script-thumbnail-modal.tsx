import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScriptThumbnailStudio } from "@/components/gauntlet/script-thumbnail-studio";

interface ScriptThumbnailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialScript?: string;
}

export function ScriptThumbnailModal({
  open,
  onOpenChange,
  initialScript,
}: ScriptThumbnailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto border-border/80 bg-bg p-0 shadow-2xl">
        <div className="p-6">
          <ScriptThumbnailStudio
            initialScript={initialScript}
            onClose={() => onOpenChange(false)}
            isModal
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
