import { useAllSites } from "@/hooks/useSites";
import { useRacks } from "@/hooks/useRacks";
import { useEquipment } from "@/hooks/useEquipment";
import { useCablesByRack } from "@/hooks/useCables";

export type PickableKind = "equipment" | "cables";

interface EntityPickerProps {
  kind: PickableKind;
  onKindChange: (kind: PickableKind) => void;
  siteId: string;
  onSiteChange: (siteId: string) => void;
  rackId: string;
  onRackChange: (rackId: string) => void;
  entityId: string;
  onEntityChange: (entityId: string, label: string) => void;
}

/**
 * Cascading Site -> Rack -> Equipment/Cable selector.
 * Used by the QR generate/manage flows so people pick a real record instead
 * of pasting a raw UUID.
 */
export function EntityPicker({
  kind,
  onKindChange,
  siteId,
  onSiteChange,
  rackId,
  onRackChange,
  entityId,
  onEntityChange,
}: EntityPickerProps) {
  const { data: sites } = useAllSites();
  const { data: rackData } = useRacks({
    siteId: siteId || undefined,
    pageSize: 200,
  });
  const racks = rackData?.data || [];

  const { data: equipmentData } = useEquipment({
    rackId: rackId || undefined,
    pageSize: 200,
  });
  const equipment = kind === "equipment" ? equipmentData?.data || [] : [];

  const { data: cables } = useCablesByRack(kind === "cables" ? rackId : "");

  const items: { id: string; label: string }[] =
    kind === "equipment"
      ? equipment.map((e) => ({
          id: e.id,
          label: `${e.name} (${e.equipment_id})`,
        }))
      : (cables || []).map((c) => ({
          id: c.id,
          label: `${c.cable_id} · ${c.cable_type}`,
        }));

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Looking for</label>
        <select
          className="input"
          value={kind}
          onChange={(e) => {
            onKindChange(e.target.value as PickableKind);
            onEntityChange("", "");
          }}
        >
          <option value="equipment">Equipment</option>
          <option value="cables">Cable</option>
        </select>
      </div>
      <div>
        <label className="label">Site</label>
        <select
          className="input"
          value={siteId}
          onChange={(e) => {
            onSiteChange(e.target.value);
            onRackChange("");
            onEntityChange("", "");
          }}
        >
          <option value="">Select a site…</option>
          {(sites || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Rack</label>
        <select
          className="input"
          value={rackId}
          disabled={!siteId}
          onChange={(e) => {
            onRackChange(e.target.value);
            onEntityChange("", "");
          }}
        >
          <option value="">
            {siteId ? "Select a rack…" : "Select a site first"}
          </option>
          {racks.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.rack_id})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">
          {kind === "equipment" ? "Equipment" : "Cable"}
        </label>
        <select
          className="input"
          value={entityId}
          disabled={!rackId}
          onChange={(e) => {
            const found = items.find((i) => i.id === e.target.value);
            onEntityChange(e.target.value, found?.label || "");
          }}
        >
          <option value="">
            {rackId
              ? `Select ${kind === "equipment" ? "equipment" : "a cable"}…`
              : "Select a rack first"}
          </option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
        </select>
        {rackId && items.length === 0 && (
          <p className="text-xs text-surface-400 mt-1">
            No {kind === "equipment" ? "equipment" : "cables"} found in this
            rack.
          </p>
        )}
      </div>
    </div>
  );
}
