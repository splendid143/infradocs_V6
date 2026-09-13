import { useState } from "react";
import { ArrowLeft, Edit, Loader2, Cpu, Trash2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useRack, useUpdateRack, useDeleteRack } from "@/hooks/useRacks";
import { useEquipmentByRack } from "@/hooks/useEquipment";
import { useAuth } from "@/features/auth/AuthProvider";

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

export function RackDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: rack, isLoading, error, refetch } = useRack(id || "");
  const { data: equipment, isLoading: eqLoading } = useEquipmentByRack(
    id || "",
  );
  const updateRack = useUpdateRack();
  const deleteRack = useDeleteRack();
  const [editing, setEditing] = useState(false);
  const canEdit = hasPermission("infrastructure.update");
  const canDelete = hasPermission("infrastructure.delete");

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const fd = new FormData(e.currentTarget);
    await updateRack.mutateAsync({
      id,
      updates: {
        name: fd.get("name") as string,
        description: (fd.get("description") as string) || null,
        rack_type: (fd.get("rackType") as string) || null,
        height_u: parseInt(fd.get("heightU") as string, 10) || rack!.height_u,
        position: fd.get("position")
          ? parseInt(fd.get("position") as string, 10)
          : null,
        status: fd.get("status") as any,
        updated_by:
          (await (await import("@/lib/supabase")).supabase.auth.getUser()).data
            .user?.id || null,
      },
    });
    setEditing(false);
    refetch();
  };

  const handleDelete = async () => {
    if (!id || !rack) return;
    if (!confirm(`Delete rack "${rack.name}"? This can't be undone.`)) return;
    try {
      await deleteRack.mutateAsync(id);
      navigate("/racks");
    } catch (err: any) {
      alert(
        err?.message?.includes("foreign key")
          ? "This rack still has equipment or patch panels on it. Delete or move those first."
          : err?.message || "Failed to delete rack",
      );
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (error || !rack) {
    return (
      <div>
        <PageHeader title="Rack" description="Not found" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            {error?.message || "Rack not found"}
            <div className="mt-4">
              <Link to="/racks" className="btn-outline">
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
        title={rack.name}
        description={rack.rack_id}
        action={
          <div className="flex gap-2">
            <Link to="/racks" className="btn-outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            {canEdit && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteRack.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
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
                <label className="label">Rack ID</label>
                <p className="font-mono text-sm">{rack.rack_id}</p>
              </div>
              <div>
                <label className="label">Status</label>
                <Badge variant={statusVariant[rack.status] || "outline"}>
                  {rack.status}
                </Badge>
              </div>
              <div>
                <label className="label">Room</label>
                {rack.room_id ? (
                  <Link
                    to={`/rooms/${rack.room_id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {rack.room_name || rack.room_id_str}
                  </Link>
                ) : (
                  "—"
                )}
              </div>
              <div>
                <label className="label">Site</label>
                <p>{rack.site_name || rack.site_id_str || "—"}</p>
              </div>
              <div>
                <label className="label">Type / Height</label>
                <p>
                  {rack.rack_type || "—"} · {rack.height_u}U{" "}
                  {rack.position != null ? `· Pos ${rack.position}` : ""}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <p className="text-surface-600">{rack.description || "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Equipment</CardTitle>
              <Link
                to={`/equipment?rackId=${rack.id}`}
                className="btn-outline btn-sm"
              >
                <Cpu className="h-4 w-4 mr-2" />
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {eqLoading && (
                <p className="text-sm text-surface-500">Loading…</p>
              )}
              {!eqLoading && (!equipment || equipment.length === 0) && (
                <p className="text-sm text-surface-500">No equipment yet.</p>
              )}
              <div className="space-y-2">
                {(equipment || []).map((eq) => (
                  <Link
                    key={eq.id}
                    to={`/equipment/${eq.id}`}
                    className="flex justify-between p-3 rounded-lg border border-surface-200 hover:bg-surface-50"
                  >
                    <div>
                      <p className="font-medium">{eq.name}</p>
                      <p className="text-xs font-mono text-surface-500">
                        {eq.equipment_id}
                      </p>
                    </div>
                    <Badge variant={statusVariant[eq.status] || "outline"}>
                      {eq.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Counts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-surface-500">Equipment</span>
              <span className="font-mono">{rack.equipment_count}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-surface-500">Patch panels</span>
              <span className="font-mono">{rack.patch_panels_count}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-surface-500">Cables</span>
              <span className="font-mono">{rack.cables_count}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Edit Rack</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={rack.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={rack.description || ""}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="rackType">Type</Label>
                    <Input
                      id="rackType"
                      name="rackType"
                      defaultValue={rack.rack_type || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="heightU">Height (U)</Label>
                    <Input
                      id="heightU"
                      name="heightU"
                      type="number"
                      defaultValue={rack.height_u}
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      name="position"
                      type="number"
                      defaultValue={rack.position ?? ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={rack.status}
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
                  <Button type="submit" disabled={updateRack.isPending}>
                    {updateRack.isPending ? "Saving…" : "Save"}
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
