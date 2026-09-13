import { useState } from "react";
import { ArrowLeft, Edit, Loader2, Server, Trash2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useRoom, useUpdateRoom, useDeleteRoom } from "@/hooks/useRooms";
import { useRacksByRoom } from "@/hooks/useRacks";
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

export function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: room, isLoading, error, refetch } = useRoom(id || "");
  const { data: racks, isLoading: racksLoading } = useRacksByRoom(id || "");
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const [editing, setEditing] = useState(false);
  const canEdit = hasPermission("infrastructure.update");
  const canDelete = hasPermission("infrastructure.delete");

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const fd = new FormData(e.currentTarget);
    await updateRoom.mutateAsync({
      id,
      updates: {
        name: fd.get("name") as string,
        description: (fd.get("description") as string) || null,
        room_type: (fd.get("roomType") as string) || null,
        floor: (fd.get("floor") as string) || null,
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
    if (!id || !room) return;
    if (!confirm(`Delete room "${room.name}"? This can't be undone.`)) return;
    try {
      await deleteRoom.mutateAsync(id);
      navigate("/rooms");
    } catch (err: any) {
      alert(
        err?.message?.includes("foreign key")
          ? "This room still has racks under it. Delete or move those first."
          : err?.message || "Failed to delete room",
      );
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (error || !room) {
    return (
      <div>
        <PageHeader title="Room" description="Not found" />
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            {error?.message || "Room not found"}
            <div className="mt-4">
              <Link to="/rooms" className="btn-outline">
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
        title={room.name}
        description={room.room_id}
        action={
          <div className="flex gap-2">
            <Link to="/rooms" className="btn-outline">
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
                disabled={deleteRoom.isPending}
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
                <label className="label">Room ID</label>
                <p className="font-mono text-sm">{room.room_id}</p>
              </div>
              <div>
                <label className="label">Status</label>
                <Badge variant={statusVariant[room.status] || "outline"}>
                  {room.status}
                </Badge>
              </div>
              <div>
                <label className="label">Site</label>
                {room.site_id ? (
                  <Link
                    to={`/sites/${room.site_id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {room.site_name || room.site_id_str || room.site_id}
                  </Link>
                ) : (
                  <p>—</p>
                )}
              </div>
              <div>
                <label className="label">Type / Floor</label>
                <p>
                  {room.room_type || "—"}{" "}
                  {room.floor ? `· Floor ${room.floor}` : ""}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <p className="text-surface-600">{room.description || "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Racks</CardTitle>
              <Link
                to={`/racks?roomId=${room.id}`}
                className="btn-outline btn-sm"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {racksLoading && (
                <p className="text-sm text-surface-500">Loading…</p>
              )}
              {!racksLoading && (!racks || racks.length === 0) && (
                <p className="text-sm text-surface-500">No racks yet.</p>
              )}
              <div className="space-y-2">
                {(racks || []).map((rack) => (
                  <Link
                    key={rack.id}
                    to={`/racks/${rack.id}`}
                    className="flex justify-between p-3 rounded-lg border border-surface-200 hover:bg-surface-50"
                  >
                    <div>
                      <p className="font-medium">{rack.name}</p>
                      <p className="text-xs font-mono text-surface-500">
                        {rack.rack_id}
                      </p>
                    </div>
                    <Badge variant={statusVariant[rack.status] || "outline"}>
                      {rack.status}
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
              <span className="text-surface-500">Racks</span>
              <span className="font-mono">{room.racks_count}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-surface-500">Equipment</span>
              <span className="font-mono">{room.equipment_count}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Edit Room</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={room.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={room.description || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="roomType">Type</Label>
                    <Input
                      id="roomType"
                      name="roomType"
                      defaultValue={room.room_type || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="floor">Floor</Label>
                    <Input
                      id="floor"
                      name="floor"
                      defaultValue={room.floor || ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={room.status}
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
                  <Button type="submit" disabled={updateRoom.isPending}>
                    {updateRoom.isPending ? "Saving…" : "Save"}
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
