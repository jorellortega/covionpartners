"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"
import { Input } from "@/components/ui/input"

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [tab, setTab] = useState<'personal' | 'project' | 'task'>('personal')
  const [projectNotes, setProjectNotes] = useState<any[]>([])
  const [taskNotes, setTaskNotes] = useState<any[]>([])
  const [loadingProject, setLoadingProject] = useState(false)
  const [loadingTask, setLoadingTask] = useState(false)
  const [search, setSearch] = useState("")

  // Fetch notes for this user
  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from("notes")
      .select("id, content, created_at")
      .eq("created_by", user.id)
      .eq("entity_type", 'personal')
      .eq("entity_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setNotes(data || [])
        setLoading(false)
      })
  }, [user])

  // Fetch project notes and task notes for each project
  useEffect(() => {
    if (!user) return
    if (tab !== 'project') return
    setLoadingProject(true)
    ;(async () => {
      // 1. Fetch all projects the user is involved with (owner or team member)
      const { data: ownedProjects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('owner_id', user.id)
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select('project_id')
        .eq('user_id', user.id)
      const memberProjectIds = teamMemberships?.map(tm => tm.project_id) || []
      let memberProjects: { id: string, name: string }[] = []
      if (memberProjectIds.length > 0) {
        const { data: memberProjectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', memberProjectIds)
        memberProjects = memberProjectsData || []
      }
      // Merge and deduplicate
      const allProjects = [...(ownedProjects || []), ...memberProjects]
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      )
      // 2. For each project, fetch project notes and task notes
      const projectNotesByProject: Record<string, any[]> = {}
      for (const project of uniqueProjects) {
        // Project notes
        const { data: projectNotes } = await supabase
          .from('notes')
          .select('id, content, created_at, note_title, entity_type, entity_id')
          .eq('created_by', user.id)
          .eq('entity_type', 'project')
          .eq('entity_id', project.id)
        // Task notes for tasks in this project
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('project_id', project.id)
        const taskIds = (tasks || []).map(t => t.id)
        let taskNotes: any[] = []
        if (taskIds.length > 0) {
          const { data: taskNotesData } = await supabase
            .from('notes')
            .select('id, content, created_at, note_title, entity_type, entity_id')
            .eq('created_by', user.id)
            .eq('entity_type', 'task')
            .in('entity_id', taskIds)
          taskNotes = taskNotesData || []
        }
        projectNotesByProject[project.id] = [
          ...(projectNotes || []),
          ...taskNotes
        ]
      }
      setProjectNotes(uniqueProjects.map(project => ({
        project,
        notes: projectNotesByProject[project.id] || []
      })))
      setLoadingProject(false)
    })()
  }, [user, tab])

  // Fetch task notes
  useEffect(() => {
    if (!user) return
    if (tab !== 'task') return
    setLoadingTask(true)
    supabase
      .from("notes")
      .select("id, content, created_at, entity_id, entity_title, note_title")
      .eq("created_by", user.id)
      .eq("entity_type", 'task')
      .order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (error) setError(error.message)
        else {
          if (data && data.length > 0) {
            const ids = [...new Set(data.map(n => n.entity_id))]
            const { data: tasks } = await supabase
              .from('tasks')
              .select('id, title, project_id')
              .in('id', ids)
            // Fetch project names for all unique project_ids
            const projectIds = [...new Set((tasks || []).map(t => t.project_id).filter(Boolean))]
            let projects: { id: string, name: string }[] = []
            if (projectIds.length > 0) {
              const { data: projectsData } = await supabase
                .from('projects')
                .select('id, name')
                .in('id', projectIds)
              projects = projectsData || []
            }
            // Attach project_name to each task
            const tasksWithProject = (tasks || []).map(t => ({
              ...t,
              project_name: projects.find(p => p.id === t.project_id)?.name || t.project_id
            }))
            setTaskNotes(data.map(n => ({
              ...n,
              task: tasksWithProject.find(t => t.id === n.entity_id)
            })))
          } else {
            setTaskNotes([])
          }
        }
        setLoadingTask(false)
      })
  }, [user, tab])

  // Filtered notes for each tab
  const filteredNotes = notes.filter(
    (n: any) => n.content.toLowerCase().includes(search.toLowerCase()) || (n.note_title || "").toLowerCase().includes(search.toLowerCase())
  )
  const filteredProjectNotes = projectNotes.map(p => ({
    ...p,
    notes: p.notes.filter(
      (n: any) => n.content.toLowerCase().includes(search.toLowerCase()) || (n.note_title || "").toLowerCase().includes(search.toLowerCase())
    )
  }))
  const filteredTaskNotes = taskNotes.filter(
    (n: any) => n.content.toLowerCase().includes(search.toLowerCase()) || (n.note_title || "").toLowerCase().includes(search.toLowerCase())
  )

  // Add a new note
  const handleSave = async () => {
    if (!newNote.trim() || !user) return
    setSaving(true)
    setError(null)
    const { error, data } = await supabase
      .from("notes")
      .insert({
        content: newNote,
        created_by: user.id,
        entity_type: 'personal',
        entity_id: user.id
      })
      .select("id, content, created_at")
      .single()
    setSaving(false)
    if (error) {
      setError(error.message)
    } else if (data) {
      setNotes([data, ...notes])
      setNewNote("")
    }
  }

  // Delete a note
  const handleDelete = async (id: string) => {
    if (!user) return
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id)
    if (!error) {
      setNotes(notes.filter(n => n.id !== id))
    } else {
      setError(error.message)
    }
  }

  // Edit a note
  const handleEdit = (id: string, content: string) => {
    setEditingId(id)
    setEditingContent(content)
  }

  // Save edited note
  const handleSaveEdit = async () => {
    if (!editingId || !editingContent.trim() || !user) return
    setSaving(true)
    setError(null)
    const { error, data } = await supabase
      .from("notes")
      .update({ content: editingContent })
      .eq("id", editingId)
      .eq("created_by", user.id)
      .eq("entity_type", 'personal')
      .eq("entity_id", user.id)
      .select("id, content, created_at")
      .single()
    setSaving(false)
    if (error) {
      setError(error.message)
    } else if (data) {
      setNotes(notes.map(n => n.id === editingId ? data : n))
      setEditingId(null)
      setEditingContent("")
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingContent("")
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">Notes</CardTitle>
            <div className="mt-4">
              <Input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={v => setTab(v as any)} className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="project">Project</TabsTrigger>
                <TabsTrigger value="task">Task</TabsTrigger>
              </TabsList>
              <TabsContent value="personal">
                <div className="mb-6">
                  <Textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Write a new note..."
                    rows={3}
                    className="mb-2"
                    disabled={saving}
                  />
                  <Button onClick={handleSave} disabled={saving || !newNote.trim()} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    {saving ? "Saving..." : "Save Note"}
                  </Button>
                  {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                </div>
                <div>
                  {loading ? (
                    <div className="text-gray-400 text-center py-8">Loading notes...</div>
                  ) : notes.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">No notes yet. Add your first note above!</div>
                  ) : filteredNotes.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">No notes match your search.</div>
                  ) : (
                    <ul className="space-y-4">
                      {filteredNotes.map(note => (
                        <li key={note.id} className="bg-gray-800/60 rounded p-4 flex justify-between items-start">
                          <div className="flex-1">
                            {editingId === note.id ? (
                              <>
                                <Textarea
                                  value={editingContent}
                                  onChange={e => setEditingContent(e.target.value)}
                                  rows={3}
                                  className="mb-2"
                                  disabled={saving}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" onClick={handleSaveEdit} disabled={saving || !editingContent.trim()}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" className="border-gray-700" onClick={handleCancelEdit} disabled={saving}>
                                    Cancel
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-gray-200 whitespace-pre-line">{note.content}</div>
                                <div className="text-xs text-gray-500 mt-2">{new Date(note.created_at).toLocaleString()}</div>
                              </>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            {editingId !== note.id && (
                              <Button
                                variant="outline"
                                className="border-gray-700 text-blue-400 hover:bg-blue-900/20 hover:text-blue-500"
                                size="sm"
                                onClick={() => handleEdit(note.id, note.content)}
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="border-gray-700 text-red-400 hover:bg-red-900/20 hover:text-red-500"
                              size="sm"
                              onClick={() => handleDelete(note.id)}
                              disabled={editingId === note.id}
                            >
                              Delete
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="project">
                {loadingProject ? (
                  <div className="text-gray-400 text-center py-8">Loading project notes...</div>
                ) : filteredProjectNotes.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">No project notes found.</div>
                ) : (
                  <div className="space-y-8">
                    {filteredProjectNotes.map(({ project, notes }) => (
                      <div key={project.id} className="bg-gray-800/60 rounded p-4">
                        <div className="text-lg font-bold text-white mb-2">
                          <Link href={`/projects/${project.id}`} className="underline hover:text-blue-400">{project.name}</Link>
                        </div>
                        {notes.length === 0 ? (
                          <div className="text-gray-400 text-center py-4">No notes for this project.</div>
                        ) : (
                          <ul className="space-y-4">
                            {notes.map((note: any) => (
                              <li key={note.id} className="bg-gray-900/60 rounded p-4 flex flex-col">
                                <div className="text-lg font-semibold text-white mb-1">
                                  <Link href={`/notes/${note.id}`} className="underline hover:text-blue-400">
                                    {note.note_title || <span className="text-gray-500 italic">(No title)</span>}
                                  </Link>
                                </div>
                                <div className="text-gray-200 whitespace-pre-line">{note.content}</div>
                                <div className="text-xs text-gray-500 mt-2">
                                  {note.entity_type === 'project' ? (
                                    <>Project Note</>
                                  ) : (
                                    <>
                                      Task Note: <Link href={`/task/${note.entity_id}`} className="underline hover:text-blue-400">View Task</Link>
                                    </>
                                  )}
                                  <br />
                                  {new Date(note.created_at).toLocaleString()}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="task">
                {loadingTask ? (
                  <div className="text-gray-400 text-center py-8">Loading task notes...</div>
                ) : filteredTaskNotes.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">No task notes found.</div>
                ) : (
                  <ul className="space-y-4">
                    {filteredTaskNotes.map(note => (
                      <li key={note.id} className="bg-gray-800/60 rounded p-4 flex flex-col">
                        <div className="text-lg font-semibold text-white mb-1">
                          <Link href={`/notes/${note.id}`} className="underline hover:text-blue-400">
                            {note.note_title || <span className="text-gray-500 italic">(No title)</span>}
                          </Link>
                        </div>
                        <div className="text-gray-200 whitespace-pre-line">{note.content}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          Task: {note.task && note.task.title ? (
                            <Link href={`/task/${note.task.id}`} className="underline hover:text-blue-400">
                              {note.task.title}
                            </Link>
                          ) : note.entity_title ? note.entity_title : 'Unknown'}
                          {/* If the task has a project, show project link */}
                          {note.task && note.task.project_id && (
                            <>
                              {' '}| Project: <Link href={`/projects/${note.task.project_id}`} className="underline hover:text-blue-400">{note.task.project_name || note.task.project_id}</Link>
                            </>
                          )}
                          <br />
                          {new Date(note.created_at).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 