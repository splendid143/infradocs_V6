import { useState } from "react";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Building2,
  Server,
  Loader2,
  Trash2,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useSite, useUpdateSite, useDeleteSite } from "@/hooks/useSites";
import { useRoomsBySite } from "@/hooks/useRooms";
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

export function SiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: site, isLoading, error, refetch } = useSite(id || "");
  const { data: rooms, isLoading: roomsLoading } = useRoomsBySite(id || "");
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();
  const [editing, setEditing] = useState(false);
  const canEdit = hasPermission("infrastructure.update");
  const canDelete = hasPermission("infrastructure.delete");

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const fd = new FormData(e.currentTarget);
    await updateSite.mutateAsync({
      id,
      updates: {
        name: fd.get("name") as string,
        description: (fd.get("description") as string) || null,
        address: (fd.get("address") as string) || null,
        city: (fd.get("city") as string) || null,
        state: (fd.get("state") as string) || null,
        country: (fd.get("country") as string) || null,
        postal_code: (fd.get("postalCode") as string) || null,
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
    if (!id || !site) return;
    if (!confirm(`Delete site "${site.name}"? This can't be undone.`)) return;
    try {
      await deleteSite.mutateAsync(id);
      navigate("/sites");
    } catch (err: any) {
      alert(
        err?.message?.includes("foreign key")
          ? "This site still has rooms under it. Delete or move those first."
          : err?.message || "Failed to delete site",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-surface-500">
        <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading site…
      </div>
    );
  }

  if (error || !site) {
    return (
      <div>
        <PageHeader title="Site" description="Not found" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            {error?.message || "Site not found"}
            <div className="mt-4">
              <Link to="/sites" className="btn-outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sites
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const address = [
    site.address,
    site.city,
    site.state,
    site.postal_code,
    site.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <PageHeader
        title={site.name}
        description={site.site_id}
        action={
          <div className="flex gap-2">
            <Link to="/sites" className="btn-outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
            {canEdit && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteSite.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
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
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Site ID</label>
                  <p className="font-mono text-sm text-surface-900">
                    {site.site_id}
                  </p>
                </div>
                <div>
                  <label className="label">Status</label>
                  <Badge variant={statusVariant[site.status] || "outline"}>
                    {site.status}
                  </Badge>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address</label>
                  <div className="flex items-center gap-2 text-surface-900">
                    <MapPin className="h-4 w-4 text-surface-400 flex-shrink-0" />
                    {address || "—"}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <p className="text-surface-600">{site.description || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rooms</CardTitle>
              <Link
                to={`/rooms?siteId=${site.id}`}
                className="btn-outline btn-sm"
              >
                <Building2 className="h-4 w-4 mr-2" /> View all
              </Link>
            </CardHeader>
            <CardContent>
              {roomsLoading && (
                <p className="text-surface-500 text-sm">Loading rooms…</p>
              )}
              {!roomsLoading && (!rooms || rooms.length === 0) && (
                <p className="text-surface-500 text-sm">
                  No rooms yet. Create one from the Rooms page.
                </p>
              )}
              <div className="space-y-2">
                {(rooms || []).map((room) => (
                  <Link
                    key={room.id}
                    to={`/rooms/${room.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:bg-surface-50"
                  >
                    <div>
                      <p className="font-medium text-surface-900">
                        {room.name}
                      </p>
                      <p className="text-xs text-surface-500 font-mono">
                        {room.room_id}
                      </p>
                    </div>
                    <Badge variant={statusVariant[room.status] || "outline"}>
                      {room.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Counts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-surface-100">
                  <span className="text-surface-500">Rooms</span>
                  <span className="font-mono font-medium">
                    {site.rooms_count}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-100">
                  <span className="text-surface-500">Racks</span>
                  <span className="font-mono font-medium">
                    {site.racks_count}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-surface-500">Equipment</span>
                  <span className="font-mono font-medium">
                    {site.equipment_count}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold text-surface-900 mb-2">
                Quick Actions
              </h3>
              <Link
                to={`/rooms?siteId=${site.id}`}
                className="btn-outline w-full justify-start gap-2"
              >
                <Building2 className="h-4 w-4" /> View Rooms
              </Link>
              <Link
                to={`/racks?siteId=${site.id}`}
                className="btn-outline w-full justify-start gap-2"
              >
                <Server className="h-4 w-4" /> View Racks
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Site</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={site.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={site.description || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={site.address || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={site.city || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      defaultValue={site.state || ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      defaultValue={site.country || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      defaultValue={site.postal_code || ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={site.status}
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
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateSite.isPending}>
                    {updateSite.isPending ? "Saving…" : "Save"}
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
