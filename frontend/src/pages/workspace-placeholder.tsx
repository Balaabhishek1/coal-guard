import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Layers, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WorkspacePlaceholderProps {
  title: string;
  subtitle: string;
  phaseText: string;
  statutoryRole: string;
}

export const WorkspacePlaceholder: React.FC<WorkspacePlaceholderProps> = ({
  title,
  subtitle,
  phaseText,
  statutoryRole,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-space-md py-space-md">
      <Card className="bg-surface-container border-outline-variant/40">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-telemetry-micro uppercase bg-primary-container/20 text-primary px-2 py-0.5 rounded border border-primary/30">
              {phaseText}
            </span>
            <span className="font-telemetry-micro uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              ROLE: {statutoryRole}
            </span>
          </div>
          <CardTitle className="text-headline-lg flex items-center gap-2 text-on-surface">
            <Layers className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription className="text-body-sm text-on-surface-variant">
            {subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-space-md">
          <div className="p-space-lg bg-surface-container-lowest rounded border border-outline-variant/30 flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center border border-primary/30">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-headline-sm text-on-surface">
              Operational Workspace Pipeline Ready
            </h4>
            <p className="text-body-sm text-on-surface-variant max-w-md">
              The statutory RBAC gate and session validation for this view have been successfully verified in Phase 1. Real-time telemetry, WebRTC video feeds, and cryptographic ledgers will bind in subsequent phases.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
            <div className="flex items-center gap-2 font-telemetry-micro text-telemetry-micro text-outline">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>CMR 2017 STATUTORY PERMIT ACTIVE</span>
            </div>
            <Link to="/dashboard">
              <Button size="sm" variant="secondary" className="gap-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspacePlaceholder;
