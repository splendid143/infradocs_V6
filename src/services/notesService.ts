import { db } from "@/lib/supabase";
import { createRecord, updateRecord, deleteRecord } from "./baseService";

export interface Note {
  id: string;
  record_type: string;
  record_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface NoteInsert extends Omit<
  Note,
  "id" | "created_at" | "updated_at" | "updated_by"
> {
  updated_by?: string | null;
}
export interface NoteUpdate extends Partial<
  Pick<Note, "content" | "updated_by">
> {}

export interface NoteWithAuthor extends Note {
  author_name?: string;
  author_email?: string;
}

export async function getNotesForRecord(
  recordType: string,
  recordId: string,
): Promise<NoteWithAuthor[]> {
  const { data, error } = await db
    .from("notes")
    .select("*, author:users!notes_created_by_fkey(name, email)")
    .eq("record_type", recordType)
    .eq("record_id", recordId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Notes fetch failed: ${error.message}`);

  return (data || []).map((n: any) => ({
    ...n,
    author_name: n.author?.name,
    author_email: n.author?.email,
  }));
}

export async function createNote(note: NoteInsert): Promise<Note> {
  return createRecord<Note, NoteInsert>("notes", note);
}

export async function updateNote(
  id: string,
  updates: NoteUpdate,
): Promise<Note> {
  return updateRecord<Note, NoteUpdate>("notes", id, updates);
}

export async function deleteNote(id: string): Promise<void> {
  return deleteRecord("notes", id);
}
