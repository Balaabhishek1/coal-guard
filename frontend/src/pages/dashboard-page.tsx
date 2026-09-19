import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Fingerprint,
  HardHat,
  Layers,
  Radio,
  Server,
  ShieldCheck,
  Wind,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const isEligible = user?.credentials?.is_statutorily_eligible ?? true;

  return (
    <div className="space-y-space-lg max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-surface-container p-space-lg rounded border border-outline-variant/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-telemetry-micro text-telemetry-micro uppercase bg-primary-container/20 text-primary px-1.5 py-0.5 rounded border border-primary/30">
              STATION: BCCL PITHEAD 04
            </span>
            <span className="font-telemetry-micro text-telemetry-micro text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
              SHIFT A: INCLINE CLUSTER
            </span>
          </div>
          <h1 className="text-display-lg-mobile md:text-headline-lg font-bold text-on-surface tracking-tight">
            Colliery Governance C2 Console
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Authenticated official:{" "}
            <span className="text-on-surface font-semibold">{user?.full_name}</span>{" "}
            ({user?.role}) • RFID Handle:{" "}
            <span className="font-mono text-primary">{user?.rfid_tag || "RFID-ASSIGNED"}</span>
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <Badge variant={isEligible ? "safe" : "critical"} dot className="py-1 px-3">
            {isEligible ? "STATUTORILY CLEARED" : "CREDENTIAL LAPSED"}
          </Badge>
          <Link to="/gate-hud">
            <Button size="sm" className="gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>Launch Pithead Gate HUD</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Telemetry Core */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Metric 1: CH4 Gas Level */}
        <Card className="bg-surface-container-low">
          <CardHeader className="p-space-md pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="font-telemetry-micro uppercase text-outline">
              CH4 Concentration (LEL)
            </span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="p-space-md pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-telemetry text-telemetry-lg font-bold text-on-surface">
                0.28%
              </span>
              <span className="text-body-sm text-emerald-400 font-telemetry">
                VOL (SAFE)
              </span>
            </div>
            <div className="mt-2 w-full bg-surface-container h-1 rounded overflow-hidden">
              <div className="bg-emerald-500 h-full w-[22%]" />
            </div>
            <span className="text-[10px] font-telemetry text-outline mt-1 block">
              TRIP CEILING: 1.25% VOL (CMR REG 181)
            </span>
          </CardContent>
        </Card>

        {/* Metric 2: Carbon Monoxide (CO) */}
        <Card className="bg-surface-container-low">
          <CardHeader className="p-space-md pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="font-telemetry-micro uppercase text-outline">
              CO Atmospheric Trace
            </span>
            <Wind className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="p-space-md pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-telemetry text-telemetry-lg font-bold text-on-surface">
                8.4
              </span>
              <span className="text-body-sm text-primary font-telemetry">
                PPM (NOMINAL)
              </span>
            </div>
            <div className="mt-2 w-full bg-surface-container h-1 rounded overflow-hidden">
              <div className="bg-primary h-full w-[17%]" />
            </div>
            <span className="text-[10px] font-telemetry text-outline mt-1 block">
              WARNING LIMIT: 25.0 PPM
            </span>
          </CardContent>
        </Card>

        {/* Metric 3: Air Velocity */}
        <Card className="bg-surface-container-low">
          <CardHeader className="p-space-md pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="font-telemetry-micro uppercase text-outline">
              Ventilation Velocity
            </span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="p-space-md pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-telemetry text-telemetry-lg font-bold text-on-surface">
                1.82
              </span>
              <span className="text-body-sm text-emerald-400 font-telemetry">
                M/S (INTAKE)
              </span>
            </div>
            <div className="mt-2 w-full bg-surface-container h-1 rounded overflow-hidden">
              <div className="bg-emerald-500 h-full w-[60%]" />
            </div>
            <span className="text-[10px] font-telemetry text-outline mt-1 block">
              STATUTORY MINIMUM: 1.0 M/S
            </span>
          </CardContent>
        </Card>

        {/* Metric 4: Shift Inbye Count */}
        <Card className="bg-surface-container-low">
          <CardHeader className="p-space-md pb-1 flex flex-row items-center justify-between space-y-0">
            <span className="font-telemetry-micro uppercase text-outline">
              Underground Personnel
            </span>
            <HardHat className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent className="p-space-md pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-telemetry text-telemetry-lg font-bold text-on-surface">
                48
              </span>
              <span className="text-body-sm text-amber-400 font-telemetry">
                INBYE CREW
              </span>
            </div>
            <div className="mt-2 w-full bg-surface-container h-1 rounded overflow-hidden">
              <div className="bg-amber-500 h-full w-[48%]" />
            </div>
            <span className="text-[10px] font-telemetry text-outline mt-1 block">
              ACTIVE SEAM-II GALLERIES
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Statutory Profile & Credential Audit Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-headline-md flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-emerald-400" />
              Statutory Certification Ledger (CMR 2017)
            </CardTitle>
            <CardDescription>
              Vocational Training Centre (VTC) &amp; Periodic Medical Exam (PME) fitness validity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-space-md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
              <div className="p-space-md bg-surface-container-lowest rounded border border-outline-variant/30 space-y-1">
                <span className="text-[10px] font-telemetry uppercase text-outline">
                  VTC Training Certificate
                </span>
                <div className="text-label-md font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VALID TO 2027-04-15</span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-telemetry block">
                  Ref: VTC-BCCL-8821
                </span>
              </div>

              <div className="p-space-md bg-surface-container-lowest rounded border border-outline-variant/30 space-y-1">
                <span className="text-[10px] font-telemetry uppercase text-outline">
                  PME Medical Fitness
                </span>
                <div className="text-label-md font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VALID TO 2027-02-10</span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-telemetry block">
                  DGMS Form "O" Medical
                </span>
              </div>

              <div className="p-space-md bg-surface-container-lowest rounded border border-outline-variant/30 space-y-1">
                <span className="text-[10px] font-telemetry uppercase text-outline">
                  Shift Elapsed Ceiling
                </span>
                <div className="text-label-md font-semibold text-primary flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>2.5 / 8.0 HOURS</span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-telemetry block">
                  Underground Rest Cycle
                </span>
              </div>
            </div>

            {/* Cryptographic Assurance Ribbon */}
            <div className="p-space-sm bg-surface-container-low rounded border border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 font-telemetry-micro text-telemetry-micro">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-sky-400" />
                <span className="text-on-surface">SHA-256 SESSION ANCHOR:</span>
                <span className="font-mono text-sky-300">
                  0x7f88e2b109c...e412f89a
                </span>
              </div>
              <span className="text-emerald-400 uppercase font-semibold">
                AUDIT LOGGED (FIPS 140-3)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Rapid Operational Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-headline-md flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Role Workspaces
            </CardTitle>
            <CardDescription>
              Quick launch into authorized governance portals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              to="/gate-hud"
              className="flex items-center justify-between p-2.5 bg-surface-container-lowest hover:bg-surface-container-high rounded border border-outline-variant/30 transition-colors text-body-sm text-on-surface"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Pithead Checkpoint HUD</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-outline" />
            </Link>

            <Link
              to="/hardware-matrix"
              className="flex items-center justify-between p-2.5 bg-surface-container-lowest hover:bg-surface-container-high rounded border border-outline-variant/30 transition-colors text-body-sm text-on-surface"
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span>Hardware Diagnostics</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-outline" />
            </Link>

            <Link
              to="/remediation-board"
              className="flex items-center justify-between p-2.5 bg-surface-container-lowest hover:bg-surface-container-high rounded border border-outline-variant/30 transition-colors text-body-sm text-on-surface"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>SLA Remediation Board</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-outline" />
            </Link>

            <Link
              to="/audit-ledger"
              className="flex items-center justify-between p-2.5 bg-surface-container-lowest hover:bg-surface-container-high rounded border border-outline-variant/30 transition-colors text-body-sm text-on-surface"
            >
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-sky-400" />
                <span>Cryptographic Audit Ledger</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-outline" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
