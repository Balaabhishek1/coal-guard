import React from "react";
import {
  MapPin,
  Building2,
  ArrowRight,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SlaCountdownTimer, useSlaCountdown } from "./sla-countdown-timer";
import type { ComplianceViolation, ViolationStatus } from "@/types/governance";
import { cn } from "@/lib/utils";

interface ViolationCardProps {
  violation: ComplianceViolation;
  onOpenTransition: (violation: ComplianceViolation) => void;
}

const NEXT_STATUS_MAP: Record<ViolationStatus, ViolationStatus | null> = {
  DETECTED: "NOTICE_SERVED",
  NOTICE_SERVED: "ACTION_TAKEN",
  ACTION_TAKEN: "VERIFIED",
  VERIFIED: "STATUTORY_CLOSEOUT",
  STATUTORY_CLOSEOUT: null,
};

const NEXT_ACTION_LABEL: Record<ViolationStatus, string> = {
  DETECTED: "Serve Statutory Notice",
  NOTICE_SERVED: "Record Action Taken",
  ACTION_TAKEN: "Verify Remediation",
  VERIFIED: "Statutory Closeout",
  STATUTORY_CLOSEOUT: "Completed",
};

export const ViolationCard: React.FC<ViolationCardProps> = ({
  violation,
  onOpenTransition,
}) => {
  const { isBreached } = useSlaCountdown(
    violation.deadline_sla,
    violation.resolved_at
  );

  const nextStatus = NEXT_STATUS_MAP[violation.status];
  const nextLabel = NEXT_ACTION_LABEL[violation.status];

  // Severity badge styling
  const renderSeverityBadge = () => {
    switch (violation.severity) {
      case "CRITICAL":
        return (
          <Badge variant="critical" dot>
            CRITICAL
          </Badge>
        );
      case "HIGH":
        return (
          <Badge variant="warning" dot>
            HIGH
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge
            variant="default"
            className="border-sky-500/40 bg-sky-500/10 text-sky-300"
            dot
          >
            MEDIUM
          </Badge>
        );
      case "LOW":
      default:
        return (
          <Badge variant="safe" dot>
            LOW
          </Badge>
        );
    }
  };

  return (
    <Card
      className={cn(
        "group relative bg-surface-container border transition-all duration-200 hover:shadow-lg hover:border-outline-variant",
        isBreached && violation.status !== "STATUTORY_CLOSEOUT"
          ? "border-rose-500/50 bg-rose-500/[0.03] shadow-[0_0_12px_rgba(244,63,94,0.15)]"
          : "border-outline-variant/40"
      )}
    >
      <CardContent className="p-space-md flex flex-col gap-2.5">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {renderSeverityBadge()}
            <span className="font-telemetry text-[10px] text-on-surface-variant/80 tracking-wider">
              {violation.violation_type}
            </span>
          </div>

          <SlaCountdownTimer
            deadlineSla={violation.deadline_sla}
            resolvedAt={violation.resolved_at}
            compact
          />
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="font-semibold text-sm text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
            {violation.title || violation.violation_type}
          </h4>
          {violation.description && (
            <p className="mt-1 text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
              {violation.description}
            </p>
          )}
        </div>

        {/* Operational Context Metadata */}
        <div className="space-y-1 pt-1 text-[11px] text-on-surface-variant/90 border-t border-outline-variant/20 font-telemetry">
          {/* Location */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-outline shrink-0" />
            <span className="truncate">
              {violation.location_name || violation.location_id}
            </span>
          </div>

          {/* Contractor or Reporter */}
          {violation.contractor_id && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-outline shrink-0" />
              <span className="truncate text-on-surface-variant/80">
                Contractor: {violation.contractor_id}
              </span>
            </div>
          )}

          {violation.reporter_name && (
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3 h-3 text-outline shrink-0" />
              <span className="truncate text-on-surface-variant/80">
                Logged by: {violation.reporter_name}
              </span>
            </div>
          )}
        </div>

        {/* Statutory State Machine Action Footer */}
        {nextStatus && (
          <div className="pt-2 mt-0.5 border-t border-outline-variant/30 flex items-center justify-between">
            <span className="text-[10px] text-outline uppercase tracking-wider font-telemetry">
              Stage: {violation.status.replace("_", " ")}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenTransition(violation)}
              className="h-7 text-xs px-2.5 gap-1.5 border-outline-variant hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <span>{nextLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        )}

        {violation.status === "STATUTORY_CLOSEOUT" && (
          <div className="pt-2 mt-0.5 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-emerald-400 font-telemetry">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Statutorily Sealed
            </span>
            <span className="text-[10px] text-outline">SHA-256 Anchored</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ViolationCard;
