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

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Username, email, or RFID tag must be at least 3 characters"),
  password: z
    .string()
    .min(6, "Passphrase must be at least 6 characters"),
  declaredCompliance: z
    .boolean()
    .refine((val) => val === true, {
      message: "Statutory compliance declaration is required",
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

const ROLE_PRESETS: RolePreset[] = [
  {
    id: "colliery_manager",
    name: "Colliery / Mine Manager",
    subtitle: "Operations Dashboard, Spatial Twin, Reports",
    role: "COLLIERY_MANAGER",
    defaultIdentifier: "manager@mineguard.in",
    defaultPassword: "ManagerSecret2026!",
    targetRoute: "/dashboard",
  },
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
    id: "overman_sirdar",
    name: "Overman / Mining Sirdar",
    subtitle: "Field Mobile Queue, Form IV Shift Diary",
    role: "OVERMAN",
    defaultIdentifier: "overman@mineguard.in",
    defaultPassword: "MinerSecret2026!",
    targetRoute: "/field-ops/sync-logs",
  },
  {
    id: "dgms_regulator",
    name: "DGMS Regulator / HQ",
    subtitle: "Apex Risk Heatmap, Audit Ledger",
    role: "DGMS_INSPECTOR",
    defaultIdentifier: "dgms@gov.in",
    defaultPassword: "SafetySecret2026!",
    targetRoute: "/governance/audit-ledger",
  },
  {
    id: "contractor_supervisor",
    name: "Contractor Supervisor",
    subtitle: "Crew Safety Compliance & Directives",
    role: "CONTRACTOR_SUPERVISOR",
    defaultIdentifier: "contractor@mineguard.in",
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

  const handleRoleSelect = (preset: RolePreset) => {
    onRoleChange(preset.id);
    setValue("identifier", preset.defaultIdentifier);
    setValue("password", preset.defaultPassword);
    setAuthError(null);
  };

  const handleSimulateRFID = () => {
    setRfidScanning(true);
    setAuthError(null);
    setTimeout(() => {
      setValue("identifier", "RFID-ELIGIBLE-001");
      setValue("password", "MinerSecret2026!");
      setRfidScanning(false);
    }, 400);
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
        "Identification failed. Verify credentials and statutory active status.";
      setAuthError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-5">
      {/* Role Preset Selector Grid */}
      <div>
        <Label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-medium mb-2.5">
          <UserCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          Operational Role Preset
        </Label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ROLE_PRESETS.map((preset) => {
            const isActive = preset.id === activeRoleId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleRoleSelect(preset)}
                className={`flex items-start gap-2.5 p-2.5 text-left rounded-xl transition-all border ${
                  isActive
                    ? "bg-slate-100 dark:bg-white/[0.08] border-slate-400 dark:border-white/20 text-slate-900 dark:text-white shadow-sm"
                    : "bg-slate-50 dark:bg-[#161822] hover:bg-slate-100 dark:hover:bg-[#1d202e] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400"
                } ${preset.id === "contractor_supervisor" ? "sm:col-span-2" : ""}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isActive
                      ? "bg-amber-400 text-black font-semibold"
                      : "bg-slate-200 dark:bg-[#202434] text-slate-600 dark:text-zinc-400"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white leading-tight truncate">
                    {preset.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    {preset.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Credentials Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-slate-50 dark:bg-[#10121a] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.06] space-y-3.5">
          {/* Subsidiary and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-zinc-400">Subsidiary / Area</Label>
              <select
                aria-label="Subsidiary Corporation"
                className="w-full h-9 px-3 bg-white dark:bg-[#181a24] text-slate-900 dark:text-white text-xs rounded-xl border border-slate-300 dark:border-white/[0.08] focus:outline-none focus:border-slate-500 dark:focus:border-white/30 cursor-pointer shadow-sm dark:shadow-none"
                defaultValue="bccl"
              >
                <option value="bccl">BCCL – Dhanbad Area IX</option>
                <option value="ecl">ECL – Raniganj Area VII</option>
                <option value="secl">SECL – Bilaspur Gevra</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-zinc-400">Pithead Unit</Label>
              <Input
                readOnly
                value="Pithead 04 - West Incline"
                className="h-9 bg-slate-100 dark:bg-[#181a24] text-slate-600 dark:text-zinc-400 text-xs cursor-not-allowed border-slate-200 dark:border-white/[0.06]"
              />
            </div>
          </div>

          {/* Identifier & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="identifier" className="text-xs text-slate-700 dark:text-zinc-300">
                  Credential / RFID / Email
                </Label>
                <button
                  type="button"
                  onClick={handleSimulateRFID}
                  disabled={rfidScanning}
                  className="text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  {rfidScanning ? "Scanning..." : "Simulate RFID Tap"}
                </button>
              </div>
              <div className="relative">
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Username, email or RFID tag"
                  {...register("identifier")}
                  error={!!errors.identifier}
                  className="h-9 text-xs pr-8 bg-white dark:bg-[#181a24] text-slate-900 dark:text-white border-slate-300 dark:border-white/[0.08]"
                />
                <Radio className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute right-3 top-3 pointer-events-none" />
              </div>
              {errors.identifier && (
                <span className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.identifier.message}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-slate-700 dark:text-zinc-300">
                  Statutory Passphrase / PIN
                </Label>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Encrypted</span>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Passphrase"
                  {...register("password")}
                  error={!!errors.password}
                  className="h-9 text-xs pr-9 bg-white dark:bg-[#181a24] text-slate-900 dark:text-white border-slate-300 dark:border-white/[0.08]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-white p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.password.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Second Factor MFA */}
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
            Mandated Second Factor Authentication
          </Label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMfaMethod("fido2")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-center transition-all border text-xs ${
                mfaMethod === "fido2"
                  ? "bg-slate-200 dark:bg-white/[0.08] border-slate-400 dark:border-white/20 text-slate-900 dark:text-white font-medium shadow-sm"
                  : "bg-slate-50 dark:bg-[#161822] hover:bg-slate-100 dark:hover:bg-[#1d202e] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>FIDO2 Hardware Key</span>
            </button>

            <button
              type="button"
              onClick={() => setMfaMethod("aadhaar")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-center transition-all border text-xs ${
                mfaMethod === "aadhaar"
                  ? "bg-slate-200 dark:bg-white/[0.08] border-slate-400 dark:border-white/20 text-slate-900 dark:text-white font-medium shadow-sm"
                  : "bg-slate-50 dark:bg-[#161822] hover:bg-slate-100 dark:hover:bg-[#1d202e] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Aadhaar / OTP</span>
            </button>
          </div>
        </div>

        {/* Statutory Declaration Checkbox */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#10121a] border border-slate-200 dark:border-white/[0.06]">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register("declaredCompliance")}
              className="mt-0.5 rounded bg-white dark:bg-[#181a24] text-slate-900 dark:text-white accent-slate-900 dark:accent-white w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-slate-700 dark:text-zinc-300 leading-snug">
              I declare compliance with{" "}
              <strong className="text-slate-900 dark:text-white font-medium">
                CMR 2017 Regulations &amp; Mines Act 1952
              </strong>
              . All actions are verified and recorded.
            </span>
          </label>
          {errors.declaredCompliance && (
            <span className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 pl-6 pt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.declaredCompliance.message}
            </span>
          )}
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="p-3 bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block text-[11px] text-rose-600 dark:text-rose-400">
                Authentication Error
              </span>
              <span>{authError}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 h-10 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs rounded-xl shadow-md gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white dark:text-black" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white dark:text-black" />
                <span>Sign In to Operational Workspace</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleSimulateRFID}
            className="w-full sm:w-auto h-10 px-4 whitespace-nowrap text-xs rounded-xl bg-white dark:bg-[#1e2230] text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-[#282d40]"
          >
            <Radio className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 mr-2" />
            <span>Turnstile RFID Mode</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
