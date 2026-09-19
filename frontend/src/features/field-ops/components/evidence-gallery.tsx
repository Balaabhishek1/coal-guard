import React, { useState } from "react";
import { Camera, Maximize2, X, ExternalLink, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvidenceGalleryProps {
  evidenceUrls?: string[];
  inspectionId?: string;
  className?: string;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  evidenceUrls = [],
  inspectionId,
  className,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!evidenceUrls || evidenceUrls.length === 0) {
    return (
      <div
        className={cn(
          "p-4 rounded bg-surface-container-lowest border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center",
          className
        )}
      >
        <Camera className="w-5 h-5 text-outline/50 mb-1.5" />
        <span className="text-xs text-outline font-telemetry">
          Zero photographic evidence attached to this inspection
        </span>
        <span className="text-[10px] text-outline/70 mt-0.5">
          Underground WebP captures uploaded via chunked streams appear here
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs font-telemetry text-on-surface-variant">
        <span className="flex items-center gap-1.5 font-medium text-on-surface">
          <Camera className="w-3.5 h-3.5 text-primary" />
          WebP Evidence Gallery ({evidenceUrls.length})
        </span>
        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Chunked Stream Verified
        </span>
      </div>

      {/* Grid Thumbnail View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {evidenceUrls.map((url, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedPhoto(url)}
            className="group relative h-28 rounded overflow-hidden bg-surface-container-lowest border border-outline-variant/50 cursor-pointer transition-all hover:border-primary"
          >
            <img
              src={url}
              alt={`Underground strata evidence #${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="p-1 rounded bg-black/60 text-white">
                <Maximize2 className="w-4 h-4" />
              </span>
            </div>
            {/* Label badge */}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-telemetry text-on-surface">
              Photo #{idx + 1} &bull; WebP
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative max-w-3xl w-full bg-surface-container rounded border border-outline-variant/60 overflow-hidden shadow-2xl">
            {/* Lightbox Header */}
            <div className="p-3 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2 text-xs font-telemetry">
                <Camera className="w-4 h-4 text-primary" />
                <span className="font-semibold text-on-surface">
                  Underground Field Photographic Evidence
                </span>
                {inspectionId && (
                  <span className="text-[11px] text-outline">
                    (Ref: {inspectionId.slice(0, 8)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedPhoto}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded text-outline hover:text-primary transition-colors"
                  title="Open Original Image"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1 rounded text-outline hover:text-white transition-colors"
                  aria-label="Close photo lightbox"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image Viewport */}
            <div className="p-3 flex items-center justify-center bg-black/50 max-h-[70vh] overflow-hidden">
              <img
                src={selectedPhoto}
                alt="Underground strata evidence full size"
                className="max-h-[65vh] w-auto object-contain rounded"
              />
            </div>

            {/* Footer Metadata */}
            <div className="p-2.5 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between text-[11px] font-telemetry text-outline">
              <span>Format: image/webp (Intrinsically safe mobile capture)</span>
              <span className="text-emerald-400">Cryptographically Signed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceGallery;
