import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Loader2,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerDevice } from "../services/hardware-api";
import type { DeviceType, ProtocolType } from "@/types/hardware";

const registerSchema = z.object({
  device_name: z
    .string()
    .min(3, "Asset name must be at least 3 characters")
    .max(100, "Asset identifier exceeds limit"),
  device_type: z.enum([
    "TURNSTILE",
    "CCTV_CAMERA",
    "GAS_SENSOR_CH4",
    "GAS_SENSOR_CO",
    "AIR_MONITOR",
    "RFID_BEACON",
  ]),
  protocol: z.enum(["MODBUS", "RTSP", "MQTT", "WIEGAND", "HTTP"]),
  ip_address: z
    .string()
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      "Enter a valid IPv4 address (e.g. 192.168.10.50)"
    )
    .optional()
    .or(z.literal("")),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterHardwareDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      device_name: "",
      device_type: "GAS_SENSOR_CH4",
      protocol: "MODBUS",
      ip_address: "192.168.10.",
    },
  });

  const mutation = useMutation({
    mutationFn: registerDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hardware-matrix"] });
      reset();
      setSubmitError(null);
      setOpen(false);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ||
        (err as Error)?.message ||
        "Colliery hardware asset registration failed";
      setSubmitError(msg);
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setSubmitError(null);
    mutation.mutate({
      device_name: data.device_name.trim(),
      device_type: data.device_type as DeviceType,
      protocol: data.protocol as ProtocolType,
      ip_address: data.ip_address?.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-primary-container text-white">
          <Plus className="w-4 h-4" />
          <span>Enroll Hardware Asset</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <HardDrive className="w-5 h-5" />
            <span className="font-telemetry-micro uppercase tracking-wider text-outline">
              COL-IOT REGISTRATION
            </span>
          </div>
          <DialogTitle>Enroll Colliery Edge Asset</DialogTitle>
          <DialogDescription>
            Register turnstiles, CCTV streams, and gas transducers into the central diagnostic telemetry matrix.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-space-md py-space-sm">
          {/* Device Identifier */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="device_name" className="text-label-sm">
              Asset Name / Label
            </Label>
            <Input
              id="device_name"
              placeholder="e.g. CAM-PITHEAD-02, ETD-SEAM02-CH4"
              {...register("device_name")}
              error={!!errors.device_name}
              className="h-8 font-telemetry text-telemetry-sm"
            />
            {errors.device_name && (
              <span className="text-[11px] text-rose-400 font-telemetry flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.device_name.message}
              </span>
            )}
          </div>

          {/* Grid: Type & Protocol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="device_type" className="text-label-sm">
                Equipment Category
              </Label>
              <select
                id="device_type"
                {...register("device_type")}
                className="w-full h-8 px-2.5 bg-surface-container text-on-surface font-body-sm rounded border border-outline-variant/50 focus:outline-none focus:border-primary appearance-none cursor-pointer"
              >
                <option value="GAS_SENSOR_CH4">Methane (CH4) Sensor</option>
                <option value="GAS_SENSOR_CO">Carbon Monoxide (CO)</option>
                <option value="AIR_MONITOR">Airflow Anemometer</option>
                <option value="CCTV_CAMERA">Pithead CCTV Camera</option>
                <option value="TURNSTILE">Biometric Turnstile</option>
                <option value="RFID_BEACON">RFID Gallery Beacon</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <Label htmlFor="protocol" className="text-label-sm">
                Interface Protocol
              </Label>
              <select
                id="protocol"
                {...register("protocol")}
                className="w-full h-8 px-2.5 bg-surface-container text-on-surface font-body-sm rounded border border-outline-variant/50 focus:outline-none focus:border-primary appearance-none cursor-pointer"
              >
                <option value="MODBUS">Modbus TCP/IP</option>
                <option value="RTSP">RTSP / WebRTC</option>
                <option value="MQTT">MQTT Telemetry Bus</option>
                <option value="WIEGAND">Wiegand RS-485</option>
                <option value="HTTP">HTTP/REST Polling</option>
              </select>
            </div>
          </div>

          {/* Network IP Address */}
          <div className="flex flex-col space-y-1">
            <Label htmlFor="ip_address" className="text-label-sm">
              Static IPv4 Address
            </Label>
            <Input
              id="ip_address"
              placeholder="192.168.10.x"
              {...register("ip_address")}
              error={!!errors.ip_address}
              className="h-8 font-telemetry text-telemetry-sm"
            />
            {errors.ip_address && (
              <span className="text-[11px] text-rose-400 font-telemetry flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.ip_address.message}
              </span>
            )}
          </div>

          {submitError && (
            <div className="p-space-sm bg-rose-950/40 border border-rose-500/40 rounded text-rose-300 font-telemetry text-telemetry-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending}
              className="gap-2 bg-primary-container text-white"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Registration</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterHardwareDialog;
