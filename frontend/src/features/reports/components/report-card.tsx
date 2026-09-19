import React from "react";
import { Download, FileText, Shield, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportMetadata } from "@/types/reports";

interface ReportCardProps {
  report: ReportMetadata;
  onSelect: (report: ReportMetadata) => void;
  isDownloading?: boolean;
  className?: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onSelect,
  isDownloading = false,
  className,
}) => {
  return (
    <Card
      className={cn(
        "bg-surface-container-low border-outline-variant/40 hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden relative group",
        className
      )}
    >
      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header & Badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="w-10 h-10 rounded bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 justify-end">
              <Badge variant="outline" className="font-telemetry text-[10px] border-primary/40 text-primary">
                {report.badgeText}
              </Badge>
              <Badge variant="outline" className="font-telemetry text-[10px] text-on-surface-variant">
                PDF
              </Badge>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
              {report.title}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              {report.subtitle}
            </p>
          </div>

          {/* Statutory Reference Tag */}
          <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-1.5 text-[11px] text-outline font-telemetry">
            <Shield className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate">{report.statutoryReference}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-on-surface-variant/90 leading-relaxed line-clamp-3">
            {report.description}
          </p>
        </div>

        {/* Footer Meta & Action */}
        <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-[11px] text-outline font-telemetry">
            <Clock className="w-3 h-3" />
            <span>{report.frequency}</span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => onSelect(report)}
            disabled={isDownloading}
            className="text-xs h-8 px-3 gap-1.5 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
          >
            {isDownloading ? (
              <>
                <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{report.requiresParameters ? "Configure" : "Download PDF"}</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;
