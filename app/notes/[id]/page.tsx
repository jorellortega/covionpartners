"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function NoteDetailPage() {
  const params = useParams()
  const noteId = params?.id as string
  const [note, setNote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [related, setRelated] = useState<any>(null)

  useEffect(() => {
    if (!noteId) return
    setLoading(true)
    supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setError("Note not found.")
          setNote(null)
        } else {
          setNote(data)
          // Fetch related entity if project or task
          if (data.entity_type === "project") {
            const { data: project } = await supabase
              .from("projects")
              .select("id, name")
              .eq("id", data.entity_id)
              .single()
            setRelated(project)
          } else if (data.entity_type === "task") {
            const { data: task } = await supabase
              .from("tasks")
              .select("id, title, project_id")
              .eq("id", data.entity_id)
              .single()
            setRelated(task)
          } else {
            setRelated(null)
          }
        }
        setLoading(false)
      })
  }, [noteId])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>
  }
  if (error || !note) {
    return <div className="min-h-screen flex items-center justify-center text-red-400">{error || "Note not found."}</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl mb-2">{note.note_title || <span className="text-gray-500 italic">(No title)</span>}</CardTitle>
            <div className="text-xs text-gray-400 mb-2">
              {note.entity_type === 'personal' && 'Personal Note'}
              {note.entity_type === 'project' && related && (
                <>
                  Project Note: <Link href={`/projects/${related.id}`} className="underline hover:text-blue-400">{related.name}</Link>
                </>
              )}
              {note.entity_type === 'task' && related && (
                <>
                  Task Note: <Link href={`/task/${related.id}`} className="underline hover:text-blue-400">{related.title}</Link>
                  {related.project_id && (
                    <>
                      {' '}| Project: <Link href={`/projects/${related.project_id}`} className="underline hover:text-blue-400">View Project</Link>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="text-xs text-gray-500">{new Date(note.created_at).toLocaleString()}</div>
          </CardHeader>
          <CardContent>
            <div className="text-gray-200 whitespace-pre-line text-lg mb-4">{note.content}</div>
            <Link href="/notes">
              <Button variant="outline" className="border-gray-700">Back to Notes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 