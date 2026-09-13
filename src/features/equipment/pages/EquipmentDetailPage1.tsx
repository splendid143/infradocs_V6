import { useState } from "react";
import { ArrowLeft, Edit, Loader2, Plus, Trash2, Cable } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { NotesPanel } from "@/components/shared/NotesPanel";
import { ActivityFeed } from "@/components/shared/ActivityFeed";
import {
  useEquipmentItem,
  useUpdateEquipment,
  useEquipmentPorts,
  useCreateEquipmentPort,
  useUpdateEquipmentPort,
  useDeleteEquipmentPort,
} from "@/hooks/useEquipment";
import { useAuth } from "@/features/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

const statusVariant: Record<
  string,
  "primary" | "success" | "warning" | "destructive" | "outline"
> = {
  PLANNED: "outline",
  INSTALLED: "primary",
  TESTED: "warning",
  VERIFIED: "success",
  ISSUE: "destructive",
  REMOVED: "destructive",
  ARCHIVED: "outline",
};

export function EquipmentDetailPage() {
  const { id } = useParams();
  const { user, hasPermission } = useAuth();
  const { data: item, isLoading, error, refetch } = useEquipmentItem(id || "");
  const updateEq = useUpdateEquipment();
  const [editing, setEditing] = useState(false);
  const [addingPort, setAddingPort] = useState(false);
  const canEdit = hasPermission("infrastructure.update");
  const canDelete = hasPermission("infrastructure.delete");

  const { data: ports, isLoading: portsLoading } = useEquipmentPorts(id || "");
  const createPort = useCreateEquipmentPort();
  const updatePort = useUpdateEquipmentPort();
  const deletePort = useDeleteEquipmentPort();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const fd = new FormData(e.currentTarget);
    await updateEq.mutateAsync({
      id,
      updates: {
        name: fd.get("name") as string,
        description: (fd.get("description") as string) || null,
        equipment_type: (fd.get("equipmentType") as string) || null,
        manufacturer: (fd.get("manufacturer") as string) || null,
        model: (fd.get("model") as string) || null,
        serial_number: (fd.get("serial") as string) || null,
        asset_tag: (fd.get("assetTag") as string) || null,
        status: fd.get("status") as any,
        updated_by: (await supabase.auth.getUser()).data.user?.id || null,
      },
    });
    setEditing(false);
    refetch();
  };

  const handleAddPort = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !user?.id) return;
    const fd = new FormData(e.currentTarget);
    await createPort.mutateAsync({
      equipment_id: id,
      port_number: fd.get("portNumber") as string,
      port_name: (fd.get("portName") as string) || null,
      port_type: (fd.get("portType") as string) || null,
      speed: (fd.get("speed") as string) || null,
      protocol: (fd.get("protocol") as string) || null,
      status: "PLANNED",
      created_by: user.id,
    });
    setAddingPort(false);
  };

  const handlePortStatus = async (portId: string, status: string) => {
    if (!id) return;
    await updatePort.mutateAsync({
      id: portId,
      equipmentId: id,
      updates: { status: status as any },
    });
  };

  const handleDeletePort = async (portId: string) => {
    if (!id) return;
    if (!confirm("Delete this port?")) return;
    await deletePort.mutateAsync({ id: portId, equipmentId: id });
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (error || !item) {
    return (
      <div>
        <PageHeader title="Equipment" description="Not found" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            {error?.message || "Not found"}
            <div className="mt-4">
              <Link to="/equipment" className="btn-outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={item.name}
        description={item.equipment_id}
        action={
          <div className="flex gap-2">
            <Link to="/equipment" className="btn-outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            {canEdit && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Equipment ID</label>
                <p className="font-mono text-sm">{item.equipment_id}</p>
              </div>
              <div>
                <label className="label">Status</label>
                <Badge variant={statusVariant[item.status] || "outline"}>
                  {item.status}
                </Badge>
              </div>
              <div>
                <label className="label">Type</label>
                <p>{item.equipment_type || "—"}</p>
              </div>
              <div>
                <label className="label">Manufacturer / Model</label>
                <p>
                  {[item.manufacturer, item.model]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <div>
                <label className="label">Serial</label>
                <p className="font-mono text-sm">{item.serial_number || "—"}</p>
              </div>
              <div>
                <label className="label">Asset tag</label>
                <p className="font-mono text-sm">{item.asset_tag || "—"}</p>
              </div>
              <div>
                <label className="label">Rack</label>
                {item.rack_id ? (
                  <Link
                    to={`/racks/${item.rack_id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {item.rack_name || item.rack_id_str}
                  </Link>
                ) : (
                  "—"
                )}
              </div>
              <div>
                <label className="label">Location</label>
                <p>
                  {[item.site_name, item.room_name]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </p>
              </div>
              <div>
                <label className="label">Position / Height</label>
                <p>
                  {item.position_u != null ? `U${item.position_u}` : "—"} ·{" "}
                  {item.height_u}U
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <p className="text-surface-600">{item.description || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Cable className="h-4 w-4" /> Ports
              </CardTitle>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingPort(true)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Port
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {portsLoading && (
                <p className="text-sm text-surface-500">Loading ports…</p>
              )}
              {!portsLoading && (!ports || ports.length === 0) && (
                <p className="text-sm text-surface-500">No ports added yet.</p>
              )}
              {!portsLoading && ports && ports.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-200">
                        <th className="table-head">Port</th>
                        <th className="table-head">Name</th>
                        <th className="table-head">Type</th>
                        <th className="table-head">Speed</th>
                        <th className="table-head">Status</th>
                        {canEdit && <th className="table-head" />}
                      </tr>
                    </thead>
                    <tbody>
                      {ports.map((port) => (
                        <tr key={port.id} className="table-row">
                          <td className="table-cell font-mono text-sm">
                            {port.port_number}
                          </td>
                          <td className="table-cell">
                            {port.port_name || "—"}
                          </td>
                          <td className="table-cell">
                            {port.port_type || "—"}
                          </td>
                          <td className="table-cell">{port.speed || "—"}</td>
                          <td className="table-cell">
                            {canEdit ? (
                              <select
                                className="input w-auto text-xs"
                                value={port.status}
                                onChange={(e) =>
                                  handlePortStatus(port.id, e.target.value)
                                }
                              >
                                {[
                                  "PLANNED",
                                  "INSTALLED",
                                  "TESTED",
                                  "VERIFIED",
                                  "ISSUE",
                                  "REMOVED",
                                  "ARCHIVED",
                                ].map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Badge
                                variant={
                                  statusVariant[port.status] || "outline"
                                }
                              >
                                {port.status}
                              </Badge>
                            )}
                          </td>
                          {canEdit && (
                            <td className="table-cell text-right">
                              {canDelete && (
                                <button
                                  onClick={() => handleDeletePort(port.id)}
                                  className="text-surface-400 hover:text-red-600"
                                  aria-label="Delete port"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <NotesPanel recordType="equipment" recordId={id || ""} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Counts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between py-2">
                <span className="text-surface-500">Ports</span>
                <span className="font-mono">
                  {ports?.length ?? item.ports_count}
                </span>
              </div>
            </CardContent>
          </Card>
          <ActivityFeed entityType="equipment" entityId={id || ""} />
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={item.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={item.description || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="equipmentType">Type</Label>
                    <Input
                      id="equipmentType"
                      name="equipmentType"
                      defaultValue={item.equipment_type || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      name="manufacturer"
                      defaultValue={item.manufacturer || ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      name="model"
                      defaultValue={item.model || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="serial">Serial</Label>
                    <Input
                      id="serial"
                      name="serial"
                      defaultValue={item.serial_number || ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="assetTag">Asset tag</Label>
                  <Input
                    id="assetTag"
                    name="assetTag"
                    defaultValue={item.asset_tag || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={item.status}
                    className="input w-full"
                  >
                    {[
                      "PLANNED",
                      "INSTALLED",
                      "TESTED",
                      "VERIFIED",
                      "ISSUE",
                      "REMOVED",
                      "ARCHIVED",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateEq.isPending}>
                    {updateEq.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {addingPort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Port</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPort} className="space-y-4">
                <div>
                  <Label htmlFor="portNumber">Port number</Label>
                  <Input
                    id="portNumber"
                    name="portNumber"
                    placeholder="e.g. 1, Gi0/1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="portName">Port name</Label>
                  <Input
                    id="portName"
                    name="portName"
                    placeholder="Optional label"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="portType">Type</Label>
                    <Input
                      id="portType"
                      name="portType"
                      placeholder="e.g. RJ45, SFP+"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speed">Speed</Label>
                    <Input id="speed" name="speed" placeholder="e.g. 1G, 10G" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="protocol">Protocol</Label>
                  <Input
                    id="protocol"
                    name="protocol"
                    placeholder="e.g. Ethernet"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddingPort(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPort.isPending}>
                    {createPort.isPending ? "Adding…" : "Add Port"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
