import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, ArrowLeft, Lock, LogOut, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const UnauthorizedPage: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const attemptedPath = (location.state as { attemptedPath?: string })?.attemptedPath || "Requested Endpoint";

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-space-lg">
      <div className="w-full max-w-lg">
        <Card className="bg-surface-container border-rose-500/40 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center mb-2">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <CardTitle className="text-headline-lg text-rose-400">
              Statutory Access Denied
            </CardTitle>
            <CardDescription className="text-on-surface-variant font-telemetry text-telemetry-sm uppercase">
              CMR 2017 REGULATION 181 • SECURITY POLICY VIOLATION
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-space-md pt-space-sm">
            <div className="p-space-md bg-surface-container-lowest rounded border border-outline-variant/30 space-y-2 text-body-sm">
              <div className="flex justify-between items-center text-[11px] font-telemetry">
                <span className="text-outline uppercase">Active Personnel</span>
                <span className="text-on-surface font-semibold">{user?.full_name || "Unknown"}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-telemetry">
                <span className="text-outline uppercase">Certified Role</span>
                <span className="text-amber-400 font-semibold">{user?.role || "UNASSIGNED"}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-telemetry">
                <span className="text-outline uppercase">Target Workspace</span>
                <span className="text-rose-400 font-mono break-all">{attemptedPath}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-space-sm bg-rose-950/30 border border-rose-500/30 rounded text-rose-300 text-body-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>
                Your current statutory role does not hold sufficient cryptographic clearance to inspect or command this operational node. This incident has been recorded to the audit ledger.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-space-sm pt-2">
              <Link to="/dashboard" className="w-full sm:flex-1">
                <Button variant="primary" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Authorized Dashboard</span>
                </Button>
              </Link>
              <Button
                variant="secondary"
                onClick={() => logout()}
                className="w-full sm:w-auto gap-2"
              >
                <LogOut className="w-4 h-4 text-outline" />
                <span>Switch Profile</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Footnote */}
        <div className="mt-4 text-center font-telemetry-micro text-telemetry-micro text-outline flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" />
          <span>FIPS 140-3 AUDIT TRACE LOGGED • DGMS APEX COMPLIANCE</span>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
