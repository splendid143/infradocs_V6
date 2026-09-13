import { useState } from "react";
import { StickyNote, Trash2, Loader2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useNotes, useCreateNote, useDeleteNote } from "@/hooks/useNotes";
import { useAuth } from "@/features/auth/AuthProvider";

interface NotesPanelProps {
  recordType: string;
  recordId: string;
}

export function NotesPanel({ recordType, recordId }: NotesPanelProps) {
  const { user, hasPermission } = useAuth();
  const { data: notes, isLoading } = useNotes(recordType, recordId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [content, setContent] = useState("");
  const canAdd = hasPermission("infrastructure.update");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user?.id) return;
    await createNote.mutateAsync({
      record_type: recordType,
      record_id: recordId,
      content: content.trim(),
      created_by: user.id,
    });
    setContent("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    await deleteNote.mutateAsync({ id, recordType, recordId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-4 w-4" /> Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {canAdd && (
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <textarea
              className="input flex-1 resize-none"
              rows={2}
              placeholder="Add a note…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button
              type="submit"
              disabled={!content.trim() || createNote.isPending}
              className="self-end"
            >
              {createNote.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        )}

        {isLoading && (
          <p className="text-sm text-surface-500">Loading notes…</p>
        )}
        {!isLoading && (!notes || notes.length === 0) && (
          <p className="text-sm text-surface-500">No notes yet.</p>
        )}

        <div className="space-y-3">
          {(notes || []).map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-lg border border-surface-200 bg-surface-50"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-surface-800 whitespace-pre-wrap">
                  {note.content}
                </p>
                {(user?.id === note.created_by ||
                  hasPermission("users.manage")) && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-surface-400 hover:text-red-600 shrink-0"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-surface-400 mt-2">
                {note.author_name || note.author_email || "Unknown"} ·{" "}
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
