import { useState } from "react";
import { ArrowLeft, Edit, Loader2, Trash2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  usePatchPanel,
  useUpdatePatchPanel,
  useDeletePatchPanel,
} from "@/hooks/usePatchPanels";
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

export function PatchPanelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: panel, isLoading, error, refetch } = usePatchPanel(id || "");
  const updatePanel = useUpdatePatchPanel();
  const deletePanel = useDeletePatchPanel();
  const [editing, setEditing] = useState(false);
  const canEdit = hasPermission("infrastructure.update");
  const canDelete = hasPermission("infrastructure.delete");

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const fd = new FormData(e.currentTarget);
    await updatePanel.mutateAsync({
      id,
      updates: {
        name: fd.get("name") as string,
        description: (fd.get("description") as string) || null,
        panel_type: (fd.get("panelType") as string) || null,
        port_count:
          parseInt(fd.get("portCount") as string, 10) || panel!.port_count,
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
    if (!id || !panel) return;
    if (
      !confirm(
        `Delete patch panel "${panel.name}"? This also removes its ports and disconnects any cables from it. This can't be undone.`,
      )
    )
      return;
    try {
      await deletePanel.mutateAsync(id);
      navigate("/patch-panels");
    } catch (err: any) {
      alert(err?.message || "Failed to delete patch panel");
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (error || !panel) {
    return (
      <div>
        <PageHeader title="Patch Panel" description="Not found" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            {error?.message || "Not found"}
            <div className="mt-4">
              <Link to="/patch-panels" className="btn-outline">
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
        title={panel.name}
        description={panel.panel_id}
        action={
          <div className="flex gap-2">
            <Link to="/patch-panels" className="btn-outline">
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
                disabled={deletePanel.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Panel ID</label>
              <p className="font-mono text-sm">{panel.panel_id}</p>
            </div>
            <div>
              <label className="label">Status</label>
              <Badge variant={statusVariant[panel.status] || "outline"}>
                {panel.status}
              </Badge>
            </div>
            <div>
              <label className="label">Type</label>
              <p>{panel.panel_type || "—"}</p>
            </div>
            <div>
              <label className="label">Port count</label>
              <p>{panel.port_count}</p>
            </div>
            <div>
              <label className="label">Rack</label>
              {panel.rack_id ? (
                <Link
                  to={`/racks/${panel.rack_id}`}
                  className="text-primary-600 hover:underline"
                >
                  {panel.rack_name || panel.rack_id_str}
                </Link>
              ) : (
                "—"
              )}
            </div>
            <div>
              <label className="label">Location</label>
              <p>
                {[panel.site_name, panel.room_name]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <p className="text-surface-600">{panel.description || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Counts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-surface-500">Ports</span>
              <span className="font-mono">
                {panel.ports_count ?? panel.port_count}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-surface-500">Connected cables</span>
              <span className="font-mono">{panel.cables_count ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Edit Patch Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={panel.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={panel.description || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="panelType">Type</Label>
                    <Input
                      id="panelType"
                      name="panelType"
                      defaultValue={panel.panel_type || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="portCount">Port count</Label>
                    <Input
                      id="portCount"
                      name="portCount"
                      type="number"
                      defaultValue={panel.port_count}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={panel.status}
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
                  <Button type="submit" disabled={updatePanel.isPending}>
                    {updatePanel.isPending ? "Saving…" : "Save"}
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
