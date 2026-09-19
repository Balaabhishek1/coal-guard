import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Radio,
  ShieldCheck,
  Smartphone,
  Tag,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { loginApi } from "../services/auth-api";
import type { UserRole } from "@/types/auth";

// Form validation schema using Zod
const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Colliery handle, email, or RFID tag must be at least 3 characters"),
  password: z
    .string()
    .min(6, "Statutory passphrase must be at least 6 characters"),
  declaredCompliance: z
    .boolean()
    .refine((val) => val === true, {
      message: "Mandatory statutory compliance declaration under CMR 2017 required",
    }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface RolePreset {
  id: string;
  name: string;
  subtitle: string;
  role: UserRole;
  defaultIdentifier: string;
  defaultPassword: string;
  targetRoute: string;
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "safety_officer",
    name: "Safety Officer / Gate Op",
    subtitle: "Pithead Gate HUD, Hardware Diagnostics",
    role: "SAFETY_OFFICER",
    defaultIdentifier: "safety@mineguard.in",
    defaultPassword: "SafetySecret2026!",
    targetRoute: "/gate-hud",
  },
  {
    id: "colliery_manager",
    name: "Colliery / Mine Manager",
    subtitle: "SLA Remediation, Spatial Twin, Reports",
    role: "COLLIERY_MANAGER",
    defaultIdentifier: "colliery_mgr",
    defaultPassword: "ManagerSecret2026!",
    targetRoute: "/manager-dashboard",
  },
  {
    id: "overman_sirdar",
    name: "Overman / Mining Sirdar",
    subtitle: "Field Mobile Queue, Form IV Diary",
    role: "OVERMAN",
    defaultIdentifier: "miner_rajesh",
    defaultPassword: "MinerSecret2026!",
    targetRoute: "/district-remediation",
  },
  {
    id: "dgms_regulator",
    name: "DGMS Regulator / HQ",
    subtitle: "Apex Risk Heatmap, Audit Ledger",
    role: "DGMS_INSPECTOR",
    defaultIdentifier: "safety_officer",
    defaultPassword: "SafetySecret2026!",
    targetRoute: "/apex-overview",
  },
  {
    id: "contractor_supervisor",
    name: "Contractor Supervisor",
    subtitle: "Crew Safety Compliance & Directives",
    role: "CONTRACTOR_SUPERVISOR",
    defaultIdentifier: "RFID-ELIGIBLE-001",
    defaultPassword: "MinerSecret2026!",
    targetRoute: "/contractor-workforce",
  },
];

interface LoginFormProps {
  activeRoleId: string;
  onRoleChange: (roleId: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  activeRoleId,
  onRoleChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rfidScanning, setRfidScanning] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<"fido2" | "aadhaar">("fido2");

  const currentPreset =
    ROLE_PRESETS.find((p) => p.id === activeRoleId) || ROLE_PRESETS[0];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: currentPreset.defaultIdentifier,
      password: currentPreset.defaultPassword,
      declaredCompliance: true,
    },
  });

  // When user switches role preset, auto-populate credentials
  const handleRoleSelect = (preset: RolePreset) => {
    onRoleChange(preset.id);
    setValue("identifier", preset.defaultIdentifier);
    setValue("password", preset.defaultPassword);
    setAuthError(null);
  };

  // Simulate hardware RFID badge scanner tap
  const handleSimulateRFID = () => {
    setRfidScanning(true);
    setAuthError(null);
    setTimeout(() => {
      setValue("identifier", "RFID-ELIGIBLE-001");
      setValue("password", "MinerSecret2026!");
      setRfidScanning(false);
    }, 450);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const response = await loginApi({
        rfid_tag_or_username: data.identifier,
        password: data.password,
      });

      if (response.access_token && response.user) {
        setAuth(response.access_token, response.user);

        // Determine destination: location state 'from' or role-specific workspace
        const fromPath = (location.state as { from?: { pathname: string } })?.from
          ?.pathname;
        const target = fromPath || currentPreset.targetRoute || "/dashboard";

        navigate(target, { replace: true });
      } else {
        throw new Error("Invalid response received from authentication authority");
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ||
        (err as Error)?.message ||
        "Colliery identification failed. Verify credentials and statutory active status.";
      setAuthError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-space-md">
      {/* Statutory Role Selector Grid */}
      <div>
        <div className="flex items-center justify-between mb-space-xs">
          <Label className="flex items-center gap-1.5 text-label-md text-on-surface">
            <UserCheck className="w-4 h-4 text-primary" />
            Designated Statutory Operational Role
          </Label>
          <span className="font-telemetry-micro text-telemetry-micro text-outline uppercase tracking-wider">
            CMR-2017 MANDATE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
          {ROLE_PRESETS.map((preset) => {
            const isActive = preset.id === activeRoleId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleRoleSelect(preset)}
                className={`flex items-start gap-2.5 p-2.5 text-left rounded transition-all border ${
                  isActive
                    ? "bg-surface-container-highest border-primary-container text-on-surface shadow-sm"
                    : "bg-surface-container-low hover:bg-surface-container-high border-outline-variant/40 text-on-surface-variant"
                } ${preset.id === "contractor_supervisor" ? "sm:col-span-2" : ""}`}
              >
                <div
                  className={`p-1 rounded ${
                    isActive
                      ? "bg-primary-container text-white"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-label-md text-on-surface leading-tight truncate">
                    {preset.name}
                  </span>
                  <span className="font-telemetry-micro text-telemetry-micro text-on-surface-variant truncate">
                    {preset.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Credentials Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded space-y-space-md border border-outline-variant/30">
          {/* Top Row: Colliery Subsidiary & Pit Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col space-y-1">
              <Label className="flex items-center justify-between text-label-sm text-on-surface-variant">
                <span>Subsidiary Corporation</span>
                <span className="font-telemetry-micro text-telemetry-micro text-primary">
                  CIL FEDERATION
                </span>
              </Label>
              <select
                aria-label="Subsidiary Corporation"
                className="w-full h-8 px-2.5 bg-surface-container text-on-surface font-body-sm rounded border border-outline-variant/50 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                defaultValue="bccl"
              >
                <option value="bccl">BCCL – Dhanbad Area IX (Jharia Coalfield)</option>
                <option value="ecl">ECL – Raniganj Coalfield Area VII</option>
                <option value="secl">SECL – Bilaspur Gevra Megaproject</option>
                <option value="cmpdi">CMPDI – Ranchi Geotech Headquarters</option>
                <option value="wcl">WCL – Nagpur Chandrapur Zone</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <Label className="flex items-center justify-between text-label-sm text-on-surface-variant">
                <span>Colliery Unit / Shaft</span>
                <span className="font-telemetry-micro text-telemetry-micro text-outline">
                  LOC-CODE
                </span>
              </Label>
              <Input
                readOnly
                value="Pithead 04 - West Incline Shaft"
                className="h-8 bg-surface-container text-body-sm font-mono text-on-surface-variant cursor-not-allowed"
              />
            </div>
          </div>

          {/* Bottom Row: Identity Handle & Passphrase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="identifier"
                  className="text-label-sm text-on-surface-variant"
                >
                  Credential / RFID / Email
                </Label>
                <button
                  type="button"
                  onClick={handleSimulateRFID}
                  disabled={rfidScanning}
                  className="text-[10px] font-telemetry text-primary hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  {rfidScanning ? "Scanning..." : "Simulate RFID Tap"}
                </button>
              </div>
              <div className="relative">
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Username, email, or RFID-XXX"
                  {...register("identifier")}
                  error={!!errors.identifier}
                  className="h-8 font-telemetry text-telemetry-sm pr-8"
                />
                <Radio className="w-4 h-4 text-outline absolute right-2.5 top-2 pointer-events-none" />
              </div>
              {errors.identifier && (
                <span className="text-[11px] text-rose-400 font-telemetry flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.identifier.message}
                </span>
              )}
            </div>

            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-label-sm text-on-surface-variant"
                >
                  Statutory Passphrase / PIN
                </Label>
                <span className="text-[10px] font-telemetry text-outline">
                  FIPS 140-3
                </span>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Passphrase"
                  {...register("password")}
                  error={!!errors.password}
                  className="h-8 font-telemetry text-telemetry-sm pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1.5 text-outline hover:text-on-surface p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-[11px] text-rose-400 font-telemetry flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.password.message}
                </span>
              )}
            </div>
          </div>

          {/* Cryptographic Dongle Ribbon */}
          <div className="flex items-center justify-between p-space-sm bg-surface-container rounded font-telemetry-micro text-telemetry-micro border border-outline-variant/30">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span className="text-on-surface">Cryptographic PKI Dongle:</span>
              <span className="text-emerald-400 font-semibold">
                e-Token Synced (Serial: 8F71-E39B)
              </span>
            </div>
            <span className="text-outline uppercase hidden sm:inline">
              HSM KEY ID: 0x904
            </span>
          </div>
        </div>

        {/* Second Factor (MFA) Simulator Tabs */}
        <div>
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm text-on-surface flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              Mandated Statutory Second Factor (CMR Reg. 181-A)
            </span>
            <span className="font-telemetry-micro text-telemetry-micro text-emerald-400">
              AAL-3 SECURE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <button
              type="button"
              onClick={() => setMfaMethod("fido2")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded text-center transition-all border ${
                mfaMethod === "fido2"
                  ? "bg-surface-container-highest border-primary-container text-on-surface shadow-sm"
                  : "bg-surface-container-low hover:bg-surface-container-high border-outline-variant/30 text-on-surface-variant"
              }`}
            >
              <KeyRound className="w-4 h-4 text-primary" />
              <span className="font-label-sm text-label-sm">FIDO2 Hardware Key</span>
            </button>

            <button
              type="button"
              onClick={() => setMfaMethod("aadhaar")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded text-center transition-all border ${
                mfaMethod === "aadhaar"
                  ? "bg-surface-container-highest border-amber-500/50 text-on-surface shadow-sm"
                  : "bg-surface-container-low hover:bg-surface-container-high border-outline-variant/30 text-on-surface-variant"
              }`}
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span className="font-label-sm text-label-sm">Aadhaar / DGMS OTP</span>
            </button>
          </div>

          <div className="mt-2 p-space-xs px-space-sm bg-surface-container-lowest rounded flex items-center justify-between font-telemetry-micro text-telemetry-micro border border-outline-variant/20">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {mfaMethod === "fido2"
                ? "Hardware Authenticator Active: YubiKey 5 Series (Touch Ready)"
                : "Aadhaar e-KYC Server: Connected to UIDAI Colliery Gateway"}
            </span>
            <span className="text-primary cursor-pointer hover:underline">
              Check Status
            </span>
          </div>
        </div>

        {/* Statutory Declaration Checkbox */}
        <div className="p-space-sm bg-surface-container-low rounded space-y-1 border border-outline-variant/30">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register("declaredCompliance")}
              className="mt-0.5 rounded bg-surface-container-lowest text-primary accent-sky-500 w-4 h-4 cursor-pointer"
            />
            <span className="font-body-sm text-body-sm text-on-surface leading-tight">
              I declare compliance with{" "}
              <strong className="text-primary font-semibold">
                CMR 2017 Regulations & Mines Act 1952
              </strong>
              . All actions are cryptographically sealed to the immutable SHA-256
              ledger.
            </span>
          </label>
          <div className="pl-6 font-telemetry-micro text-telemetry-micro text-outline flex items-center gap-2">
            <span>ROOT ANCHOR: 0x98EF...3C20</span>
            <span>•</span>
            <span>AUDIT TRACE: ENABLED</span>
            <span>•</span>
            <span className="text-amber-400">LEGAL NON-REPUDIATION</span>
          </div>
          {errors.declaredCompliance && (
            <span className="text-[11px] text-rose-400 font-telemetry flex items-center gap-1 pl-6 pt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.declaredCompliance.message}
            </span>
          )}
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="p-space-sm bg-rose-950/40 border border-rose-500/50 rounded flex items-start gap-2 text-rose-300 font-telemetry text-telemetry-sm">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block uppercase text-[10px] tracking-wider text-rose-400">
                Access Arbitration Failed
              </span>
              <span>{authError}</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-space-md pt-space-xs">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 h-10 bg-primary-container hover:bg-sky-400 text-white font-semibold text-headline-sm rounded shadow-md gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Statutory Credentials...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Sign In to Operational Workspace</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleSimulateRFID}
            className="w-full sm:w-auto h-10 px-4 whitespace-nowrap text-label-md"
          >
            <Radio className="w-4 h-4 text-amber-400 mr-2" />
            <span>Turnstile RFID Mode</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
