import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  Camera,
  DoorOpen,
  Filter,
  Flame,
  Radio,
  Search,
  Server,
  Wind,
} from "lucide-react";
import { PingIndicator } from "./ping-indicator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatStatutoryDateTime } from "@/lib/utils";
import type { HardwareDevice, DeviceType } from "@/types/hardware";

interface HardwareTableProps {
  devices: HardwareDevice[];
  isLoading?: boolean;
}

const DEVICE_TYPE_ICONS: Record<
  DeviceType,
  React.ComponentType<{ className?: string }>
> = {
  TURNSTILE: DoorOpen,
  CCTV_CAMERA: Camera,
  GAS_SENSOR_CH4: Flame,
  GAS_SENSOR_CO: Flame,
  AIR_MONITOR: Wind,
  RFID_BEACON: Radio,
};

export const HardwareTable: React.FC<HardwareTableProps> = ({
  devices,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"smart" | "name" | "latency">("smart");

  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      const matchesSearch =
        dev.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dev.ip_address && dev.ip_address.includes(searchQuery)) ||
        (dev.location_name &&
          dev.location_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        selectedType === "ALL" || dev.device_type === selectedType;

      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "ONLINE" && dev.is_online) ||
        (selectedStatus === "OFFLINE" && !dev.is_online);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [devices, searchQuery, selectedType, selectedStatus]);

  const sortedDevices = useMemo(() => {
    return [...filteredDevices].sort((a, b) => {
      if (sortBy === "smart") {
        // Smart sorting: offline devices first, then degraded, then online
        if (a.is_online !== b.is_online) {
          return a.is_online ? 1 : -1;
        }
        const latA = a.latency_ms ?? 0;
        const latB = b.latency_ms ?? 0;
        return latB - latA;
      }
      if (sortBy === "name") {
        return a.device_name.localeCompare(b.device_name);
      }
      if (sortBy === "latency") {
        return (b.latency_ms ?? 0) - (a.latency_ms ?? 0);
      }
      return 0;
    });
  }, [filteredDevices, sortBy]);

  return (
    <div className="space-y-space-md">
      {/* Search & Filter Controls Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-low p-space-sm rounded border border-outline-variant/30">
        <div className="flex flex-wrap items-center gap-space-sm flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-outline absolute left-2.5 top-2.5 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by device label, IP address, or location..."
              className="h-8 pl-8 text-body-sm font-telemetry"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-outline shrink-0" />
            <select
              aria-label="Filter by Device Type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-8 px-2 bg-surface-container text-on-surface font-telemetry-sm rounded border border-outline-variant/40 focus:outline-none focus:border-primary text-xs cursor-pointer"
            >
              <option value="ALL">All Equipment Types</option>
              <option value="GAS_SENSOR_CH4">CH4 Sensors</option>
              <option value="GAS_SENSOR_CO">CO Sensors</option>
              <option value="AIR_MONITOR">Air Monitors</option>
              <option value="CCTV_CAMERA">CCTV Cameras</option>
              <option value="TURNSTILE">Turnstiles</option>
              <option value="RFID_BEACON">RFID Beacons</option>
            </select>
          </div>

          <select
            aria-label="Filter by Connectivity"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-2 bg-surface-container text-on-surface font-telemetry-sm rounded border border-outline-variant/40 focus:outline-none focus:border-primary text-xs cursor-pointer"
          >
            <option value="ALL">All Connectivity</option>
            <option value="ONLINE">Online Only</option>
            <option value="OFFLINE">Offline Alerts</option>
          </select>
        </div>

        {/* Sorting Toggle */}
        <div className="flex items-center gap-2">
          <span className="font-telemetry-micro uppercase text-outline text-[10px]">
            SORT:
          </span>
          <button
            type="button"
            onClick={() =>
              setSortBy(
                sortBy === "smart"
                  ? "name"
                  : sortBy === "name"
                  ? "latency"
                  : "smart"
              )
            }
            className="h-8 px-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-telemetry-sm rounded border border-outline-variant/40 flex items-center gap-1.5 text-xs transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
            <span className="uppercase">
              {sortBy === "smart"
                ? "Priority (Alerts Top)"
                : sortBy === "name"
                ? "Device Name"
                : "Latency"}
            </span>
          </button>
        </div>
      </div>

      {/* High-Density Telemetry Table */}
      <div className="rounded border border-outline-variant/40 overflow-hidden bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant/50 text-outline font-telemetry text-telemetry-micro uppercase tracking-wider">
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Device Identifier</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Colliery Location</th>
                <th className="py-2.5 px-3">Heartbeat Latency</th>
                <th className="py-2.5 px-3">Last Ping (IST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-telemetry-sm text-telemetry-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-outline">
                    Scanning Colliery Modbus / Ethernet Bus...
                  </td>
                </tr>
              ) : sortedDevices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-outline">
                    No hardware devices matching current query.
                  </td>
                </tr>
              ) : (
                sortedDevices.map((dev) => {
                  const Icon =
                    DEVICE_TYPE_ICONS[dev.device_type] || Server;

                  return (
                    <tr
                      key={dev.hardware_id || dev.device_name}
                      className={`hover:bg-surface-container transition-colors ${
                        !dev.is_online ? "bg-rose-950/10" : ""
                      }`}
                    >
                      {/* State Dot */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              dev.is_online
                                ? "bg-emerald-400"
                                : "bg-rose-500 animate-pulse"
                            }`}
                          />
                          <span
                            className={`font-mono text-[10px] font-semibold uppercase ${
                              dev.is_online
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {dev.is_online ? "ONLINE" : "OFFLINE"}
                          </span>
                        </div>
                      </td>

                      {/* Device Identifier */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-surface-container flex items-center justify-center text-primary shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-mono font-semibold text-on-surface block leading-tight">
                              {dev.device_name}
                            </span>
                            <span className="text-[10px] text-outline block">
                              ID: {dev.hardware_id?.slice(0, 13) || "HW-SYS"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-telemetry px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant uppercase">
                          {dev.device_type}
                        </span>
                      </td>

                      {/* Protocol Badge */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <Badge variant="identity" className="text-[10px]">
                          {dev.protocol || "MODBUS"}
                        </Badge>
                      </td>

                      {/* IP Address */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-on-surface-variant">
                        {dev.ip_address || "DHCP-LEASE"}
                      </td>

                      {/* Location */}
                      <td className="py-2 px-3 whitespace-nowrap text-on-surface text-body-sm font-sans truncate max-w-[200px]">
                        {dev.location_name || "Pithead Shaft Inset"}
                      </td>

                      {/* Ping Latency */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <PingIndicator
                          isOnline={dev.is_online}
                          latencyMs={dev.latency_ms}
                        />
                      </td>

                      {/* Last Heartbeat */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-outline">
                        {formatStatutoryDateTime(dev.last_heartbeat)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HardwareTable;
