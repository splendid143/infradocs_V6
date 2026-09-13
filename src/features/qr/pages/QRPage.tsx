import { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Camera,
  Download,
  RotateCcw,
  Plus,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  EntityPicker,
  type PickableKind,
} from "@/components/shared/EntityPicker";
import {
  useQRCodeByEntity,
  useCreateQRCode,
  useRegenerateQRCode,
  useDeactivateQRCode,
  useQRCodesByEntity,
} from "@/hooks/useQR";
import { useAuth } from "@/features/auth/AuthProvider";

export function QRPage() {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<"scan" | "generate" | "manage">(
    "generate",
  );
  const [generatedQR, setGeneratedQR] = useState<{
    token: string;
    url: string;
    id: string;
  } | null>(null);
  const [scannedResult, setScannedResult] = useState<{
    url: string;
    entityType: string;
    entityId: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Shared cascading picker state (Site -> Rack -> Equipment/Cable)
  const [pickKind, setPickKind] = useState<PickableKind>("equipment");
  const [pickSiteId, setPickSiteId] = useState("");
  const [pickRackId, setPickRackId] = useState("");
  const [entityId, setEntityId] = useState("");
  const [entityLabel, setEntityLabel] = useState("");

  const canCreate = hasPermission("infrastructure.create");
  const createQR = useCreateQRCode();

  // Scan tab - Camera-based QR scanning
  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Camera access is required for QR code scanning");
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.drawImage(video, 0, 0);

    // Try to detect QR code using canvas
    try {
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (imageData) {
        // Simple QR code detection - in production use a library like jsQR
        // For now, we'll just show the camera feed
      }
    } catch (e) {
      // Ignore
    }

    requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (isScanning) {
      scanFrame();
    }
    return () => stopScanning();
  }, [isScanning]);

  // Generate tab
  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId) return;

    try {
      const result = await createQR.mutateAsync({
        entityType: pickKind,
        entityId,
        options: { createdBy: user?.id || "", expiresAt: undefined },
      });
      setGeneratedQR({
        token: result.token,
        url: (result as any).entity_url || "",
        id: result.id,
      });
    } catch (err) {
      console.error("QR generation failed:", err);
      alert("Failed to generate QR code");
    }
  };

  // Manage tab
  const { data: managedQRs, refetch: refetchQRs } = useQRCodesByEntity(
    pickKind,
    entityId,
  );
  const regenerateMutation = useRegenerateQRCode();
  const deactivateMutation = useDeactivateQRCode();

  const handleRegenerate = async (id: string) => {
    try {
      await regenerateMutation.mutateAsync({ id, createdBy: user?.id || "" });
      refetchQRs();
    } catch (err) {
      alert("Failed to regenerate QR code");
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this QR code?")) return;
    try {
      await deactivateMutation.mutateAsync(id);
      refetchQRs();
    } catch (err) {
      alert("Failed to deactivate QR code");
    }
  };

  const downloadQR = (token: string) => {
    const url = `${window.location.origin}/qr/${token}`;
    const link = document.createElement("a");
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    link.download = `qr-${token}.png`;
    link.click();
  };

  return (
    <div>
      <PageHeader
        title="QR Codes"
        description="Scan and manage QR codes for infrastructure"
      />

      {/* Tabs */}
      <div className="flex border-b border-surface-200 mb-6">
        <button
          onClick={() => {
            setActiveTab("scan");
            setScannedResult(null);
          }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "scan"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-surface-500 hover:text-surface-700"
          }`}
        >
          <Camera className="h-4 w-4 inline mr-2" /> Scan QR Code
        </button>
        <button
          onClick={() => {
            setActiveTab("generate");
            setGeneratedQR(null);
          }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "generate"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-surface-500 hover:text-surface-700"
          }`}
        >
          <QrCode className="h-4 w-4 inline mr-2" /> Generate QR Code
        </button>
        <button
          onClick={() => {
            setActiveTab("manage");
          }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "manage"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-surface-500 hover:text-surface-700"
          }`}
        >
          <Plus className="h-4 w-4 inline mr-2" /> Manage QR Codes
        </button>
      </div>

      {/* Scan Tab */}
      {activeTab === "scan" && (
        <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Scanner</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover rounded-lg"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-surface-50 rounded-lg">
                    <Camera className="h-16 w-16 text-surface-300 mb-4" />
                    <p className="text-surface-500 text-center">
                      Click "Start Scanning" to use camera
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-primary-600 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={isScanning ? stopScanning : startScanning}
                  className="flex-1"
                  loading={isScanning}
                >
                  {isScanning ? "Stop Scanning" : "Start Scanning"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scan Result</CardTitle>
            </CardHeader>
            <CardContent>
              {scannedResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <p className="font-medium text-green-800">
                      QR Code Detected!
                    </p>
                    <p className="text-sm text-green-700 mt-1 font-mono break-all">
                      {scannedResult.url}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Type: {scannedResult.entityType} • ID:{" "}
                      {scannedResult.entityId}
                    </p>
                  </div>
                  <a
                    href={scannedResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary w-full"
                  >
                    Open Record
                  </a>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setScannedResult(null)}
                  >
                    Scan Another
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-surface-500">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-surface-300" />
                  <p>Point camera at a QR code to scan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === "generate" && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Generate QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateQR} className="space-y-4">
                <EntityPicker
                  kind={pickKind}
                  onKindChange={(k) => {
                    setPickKind(k);
                    setPickSiteId("");
                    setPickRackId("");
                    setEntityId("");
                    setEntityLabel("");
                    setGeneratedQR(null);
                  }}
                  siteId={pickSiteId}
                  onSiteChange={(id) => {
                    setPickSiteId(id);
                    setGeneratedQR(null);
                  }}
                  rackId={pickRackId}
                  onRackChange={(id) => {
                    setPickRackId(id);
                    setGeneratedQR(null);
                  }}
                  entityId={entityId}
                  onEntityChange={(id, label) => {
                    setEntityId(id);
                    setEntityLabel(label);
                    setGeneratedQR(null);
                  }}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!entityId || createQR.isPending}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {createQR.isPending ? "Generating…" : "Generate QR Code"}
                </Button>
              </form>

              {generatedQR && (
                <div className="mt-6 p-4 rounded-lg bg-surface-50 border border-surface-200">
                  <h4 className="font-medium text-surface-900 mb-3">
                    Generated QR Code
                  </h4>
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(generatedQR.url)}`}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                    <div className="text-center">
                      <p className="text-sm text-surface-500">{entityLabel}</p>
                      <p className="text-sm text-surface-500 mt-1">
                        Token:{" "}
                        <code className="font-mono">{generatedQR.token}</code>
                      </p>
                      <p className="text-sm text-surface-500 mt-1">
                        URL:{" "}
                        <code className="font-mono break-all">
                          {generatedQR.url}
                        </code>
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <a
                        href={generatedQR.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" /> Open Record
                      </a>
                      <Button
                        variant="outline"
                        onClick={() => downloadQR(generatedQR.token)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PNG
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigator.clipboard.writeText(generatedQR.url)
                        }
                      >
                        Copy URL
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === "manage" && (
        <div className="max-w-3xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find a Record</CardTitle>
            </CardHeader>
            <CardContent>
              <EntityPicker
                kind={pickKind}
                onKindChange={(k) => {
                  setPickKind(k);
                  setPickSiteId("");
                  setPickRackId("");
                  setEntityId("");
                  setEntityLabel("");
                }}
                siteId={pickSiteId}
                onSiteChange={setPickSiteId}
                rackId={pickRackId}
                onRackChange={setPickRackId}
                entityId={entityId}
                onEntityChange={(id, label) => {
                  setEntityId(id);
                  setEntityLabel(label);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{entityLabel || "QR Codes"}</CardTitle>
            </CardHeader>
            <CardContent>
              {entityId ? (
                <div className="space-y-4">
                  {managedQRs && managedQRs.length > 0 ? (
                    managedQRs.map((qr) => (
                      <div
                        key={qr.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-surface-200"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent((qr as any).entity_url || "")}`}
                            alt="QR"
                            className="h-16 w-16 rounded"
                          />
                          <div>
                            <p className="font-medium text-surface-900">
                              {qr.token}
                            </p>
                            <p className="text-sm text-surface-500 font-mono break-all">
                              {(qr as any).entity_url}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={qr.is_active ? "success" : "outline"}
                              >
                                {qr.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {qr.expires_at && (
                                <Badge variant="outline">
                                  Expires:{" "}
                                  {new Date(qr.expires_at).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={(qr as any).entity_url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-outline btn-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadQR(qr.token)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {qr.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerate(qr.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant={qr.is_active ? "destructive" : "outline"}
                            size="sm"
                            onClick={() =>
                              qr.is_active ? handleDeactivate(qr.id) : null
                            }
                            disabled={!qr.is_active}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-surface-500">
                      <QrCode className="h-12 w-12 mx-auto mb-4 text-surface-300" />
                      <p>No QR codes found for this record</p>
                      {canCreate && (
                        <Button
                          className="mt-4"
                          onClick={() => setActiveTab("generate")}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Generate First QR Code
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-surface-500">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-surface-300" />
                  <p>
                    Select a site, rack, and equipment or cable above to manage
                    its QR codes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
