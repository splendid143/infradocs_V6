import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotesForRecord,
  createNote,
  updateNote,
  deleteNote,
} from "@/services/notesService";
import type { NoteInsert, NoteUpdate } from "@/services/notesService";

export function useNotes(recordType: string, recordId: string) {
  return useQuery({
    queryKey: ["notes", recordType, recordId],
    queryFn: () => getNotesForRecord(recordType, recordId),
    enabled: !!recordType && !!recordId,
    staleTime: 1000 * 30,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: NoteInsert) => createNote(note),
    onSuccess: (_, note) => {
      queryClient.invalidateQueries({
        queryKey: ["notes", note.record_type, note.record_id],
      });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      recordType: string;
      recordId: string;
      updates: NoteUpdate;
    }) => updateNote(id, updates),
    onSuccess: (_, { recordType, recordId }) => {
      queryClient.invalidateQueries({
        queryKey: ["notes", recordType, recordId],
      });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
    }: {
      id: string;
      recordType: string;
      recordId: string;
    }) => deleteNote(id),
    onSuccess: (_, { recordType, recordId }) => {
      queryClient.invalidateQueries({
        queryKey: ["notes", recordType, recordId],
      });
    },
  });
}
