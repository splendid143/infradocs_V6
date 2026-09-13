import { Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useEntityAuditHistory } from "@/hooks/useAudit";

interface ActivityFeedProps {
  entityType: string;
  entityId: string;
  limit?: number;
}

const actionLabel: Record<string, string> = {
  RECORD_CREATED: "Created",
  RECORD_UPDATED: "Updated",
  RECORD_DELETED: "Deleted",
  RECORD_ARCHIVED: "Archived",
  STATUS_CHANGED: "Status changed",
  FILE_UPLOADED: "File uploaded",
  FILE_DELETED: "File deleted",
  CABLE_CONNECTED: "Cable connected",
  CABLE_DISCONNECTED: "Cable disconnected",
};

const actionVariant: Record<
  string,
  "primary" | "success" | "warning" | "destructive" | "outline"
> = {
  RECORD_CREATED: "success",
  RECORD_UPDATED: "primary",
  RECORD_DELETED: "destructive",
  RECORD_ARCHIVED: "outline",
  STATUS_CHANGED: "warning",
};

export function ActivityFeed({
  entityType,
  entityId,
  limit = 15,
}: ActivityFeedProps) {
  const {
    data: logs,
    isLoading,
    error,
  } = useEntityAuditHistory(entityType, entityId);
  const items = (logs || []).slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-surface-500 py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading activity…
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600">Couldn't load activity.</p>
        )}
        {!isLoading && !error && items.length === 0 && (
          <p className="text-sm text-surface-500">No activity recorded yet.</p>
        )}
        <ol className="space-y-3">
          {items.map((log) => (
            <li key={log.id} className="flex items-start gap-3 text-sm">
              <Badge
                variant={actionVariant[log.action] || "outline"}
                className="mt-0.5 shrink-0"
              >
                {actionLabel[log.action] || log.action}
              </Badge>
              <div className="min-w-0">
                <p className="text-surface-700">
                  by{" "}
                  <span className="font-medium">
                    {log.actor_name || log.actor_email || "Unknown"}
                  </span>
                  {log.details ? ` — ${log.details}` : ""}
                </p>
                <p className="text-xs text-surface-400">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
