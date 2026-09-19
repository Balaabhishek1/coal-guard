import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Calendar, MapPin, Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import type { ReportMetadata, ReportGeneratePayload } from "@/types/reports";

interface ReportParameterDialogProps {
  report: ReportMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (payload: ReportGeneratePayload) => Promise<void>;
  isGenerating?: boolean;
}

export const ReportParameterDialog: React.FC<ReportParameterDialogProps> = ({
  report,
  isOpen,
  onClose,
  onGenerate,
  isGenerating = false,
}) => {
  const [mineCode, setMineCode] = useState("MINE-ALPHA-01");
  const [shift, setShift] = useState("SHIFT_1");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!report) return null;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await onGenerate({
        report_type: report.id,
        mine_code: mineCode,
        shift: shift,
        start_date: startDate,
        end_date: endDate,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate report PDF.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface-container-low border-outline-variant/60">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
              <FileDown className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="text-base text-on-surface">
              {report.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-on-surface-variant">
            {report.statutoryReference}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Colliery Code */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-outline" />
              <span>Colliery Identification Code</span>
            </label>
            <select
              value={mineCode}
              onChange={(e) => setMineCode(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-sans"
            >
              <option value="MINE-ALPHA-01">MINE-ALPHA-01 (Rajmahal Seam-III Incline)</option>
              <option value="MINE-BETA-02">MINE-BETA-02 (Jharia Seam-I Main Drift)</option>
              <option value="MINE-GAMMA-03">MINE-GAMMA-03 (Raniganj Deep Ventilation Pit)</option>
            </select>
          </div>

          {/* Operational Shift */}
          {report.id === "DGMS_SHIFT_SUMMARY" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-outline" />
                <span>Operational Mining Shift</span>
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-sans"
              >
                <option value="SHIFT_1">Shift 1 - Morning (06:00 to 14:00 IST)</option>
                <option value="SHIFT_2">Shift 2 - Afternoon (14:00 to 22:00 IST)</option>
                <option value="SHIFT_3">Shift 3 - Night (22:00 to 06:00 IST)</option>
              </select>
            </div>
          )}

          {/* Date Window */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-outline" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-8 px-2 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-telemetry"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-telemetry uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-outline" />
                <span>End Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-8 px-2 rounded bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-telemetry"
              />
            </div>
          </div>

          {/* Statutory Security Disclaimer */}
          <div className="p-2.5 rounded bg-primary/5 border border-primary/20 flex items-start gap-2 text-[11px] text-on-surface-variant">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              All generated PDFs embed immutable SHA-256 root hashes anchored to the DGMS statutory ledger.
            </span>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isGenerating}
            className="text-xs border-outline-variant"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isGenerating}
            className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Compiling Report PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Generate & Download</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportParameterDialog;
