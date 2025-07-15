"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Users, FileText, FolderKanban, Send, Plus, Trash, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Text } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useRef } from "react"

// Mock data for available projects and collaborators
const mockProjects = [
  { id: "1", name: "Project Alpha" },
  { id: "2", name: "Project Beta" },
]

const mockCollaborators = [
  { id: "u1", name: "Alice Writer", avatar: "A", active: true },
  { id: "u2", name: "Bob Screenplay", avatar: "B", active: false },
  { id: "u3", name: "Charlie Script", avatar: "C", active: true },
]

// Overlay notes per page: { [pageIdx: number]: Array<{id, content, x, y}> }
function getInitialOverlayNotes() {
  try {
    return JSON.parse(localStorage.getItem('scriptWriterOverlayNotes') || '{}')
  } catch { return {} }
}

const WRITER_TOOLS = [
  { label: 'Character', insert: 'CHARACTER NAME\n' },
  { label: 'Scene', insert: 'INT. LOCATION - DAY\n' },
  { label: 'Action', insert: 'Action description here.\n' },
  { label: 'Dialogue', insert: 'CHARACTER\nDialogue here.\n' },
]

export default function ScriptWriterPage() {
  const router = useRouter()
  const [selectedProject, setSelectedProject] = useState<string>("none")
  const [customProjectName, setCustomProjectName] = useState("")
  const [scriptTitle, setScriptTitle] = useState("")
  const [scriptType, setScriptType] = useState("movie")
  const [scriptContent, setScriptContent] = useState("")
  const [collaborators, setCollaborators] = useState<{id: string, name: string, avatar: string, active: boolean}[]>(mockCollaborators)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [pages, setPages] = useState<string[]>([""])
  const [currentPage, setCurrentPage] = useState(0)
  const [versionHistory, setVersionHistory] = useState<{timestamp: number, title: string, pages: string[], scriptType: string, project: string, customProjectName: string}[]>([])
  const [viewingVersion, setViewingVersion] = useState<null | {timestamp: number, title: string, pages: string[], scriptType: string, project: string, customProjectName: string}>(null)
  const [viewMode, setViewMode] = useState<'single' | 'double' | 'quad' | 'all'>('single')
  const [viewStart, setViewStart] = useState(0)
  const [notes, setNotes] = useState<{id: string, content: string, timestamp: number}[]>([])
  const [newNote, setNewNote] = useState("")
  const [overlayNotes, setOverlayNotes] = useState<{[pageIdx: number]: Array<{id: string, content: string, x: number, y: number}>}>(getInitialOverlayNotes())
  const overlayContainerRefs = useRef<{[key: number]: HTMLDivElement | null}>({})
  const [editingOverlayNote, setEditingOverlayNote] = useState<{pageIdx: number, noteId: string} | null>(null)
  const overlayEditRef = useRef<HTMLTextAreaElement | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [fontSize, setFontSize] = useState(16)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left')
  const pageRef = useRef<HTMLDivElement | null>(null)
  const mainTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Load version history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('scriptWriterVersionHistory')
    if (saved) {
      try {
        setVersionHistory(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // Save version history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('scriptWriterVersionHistory', JSON.stringify(versionHistory))
  }, [versionHistory])

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('scriptWriterNotes')
    if (saved) {
      try {
        setNotes(JSON.parse(saved))
      } catch {}
    }
  }, [])
  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('scriptWriterNotes', JSON.stringify(notes))
  }, [notes])
  const handleAddNote = () => {
    if (!newNote.trim()) return
    setNotes([{id: Date.now().toString(), content: newNote, timestamp: Date.now()}, ...notes])
    setNewNote("")
  }
  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id))
  }
  const handleEditNote = (id: string, content: string) => {
    setNotes(notes.map(n => n.id === id ? {...n, content} : n))
  }

  // Save overlay notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('scriptWriterOverlayNotes', JSON.stringify(overlayNotes))
  }, [overlayNotes])

  // Overlay note handlers
  const addOverlayNote = (pageIdx: number) => {
    setOverlayNotes(prev => ({
      ...prev,
      [pageIdx]: [
        ...(prev[pageIdx] || []),
        { id: Date.now().toString(), content: '', x: 40, y: 40 }
      ]
    }))
  }
  const updateOverlayNote = (pageIdx: number, noteId: string, data: Partial<{content: string, x: number, y: number}>) => {
    setOverlayNotes(prev => ({
      ...prev,
      [pageIdx]: (prev[pageIdx] || []).map(n => n.id === noteId ? { ...n, ...data } : n)
    }))
  }
  const deleteOverlayNote = (pageIdx: number, noteId: string) => {
    setOverlayNotes(prev => ({
      ...prev,
      [pageIdx]: (prev[pageIdx] || []).filter(n => n.id !== noteId)
    }))
  }

  // Drag logic for overlay notes
  const handleDrag = (pageIdx: number, noteId: string, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const note = (overlayNotes[pageIdx] || []).find(n => n.id === noteId)
    if (!note) return
    const origX = note.x
    const origY = note.y
    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      updateOverlayNote(pageIdx, noteId, { x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Placeholder for saving script (future backend integration)
  const handleSaveScript = () => {
    // Save current script as a new version
    const newVersion = {
      timestamp: Date.now(),
      title: scriptTitle,
      pages: [...pages],
      scriptType,
      project: selectedProject,
      customProjectName
    }
    setVersionHistory([newVersion, ...versionHistory])
    alert("Script saved! (Version history updated)")
  }

  // Placeholder for inviting collaborator
  const handleInvite = () => {
    if (!inviteEmail) return
    setInviting(true)
    setTimeout(() => {
      setCollaborators([
        ...collaborators,
        {
          id: `u${collaborators.length+1}`,
          name: inviteEmail,
          avatar: inviteEmail.charAt(0).toUpperCase(),
          active: true // Assume newly invited user is active for demo
        }
      ])
      setInviteEmail("")
      setInviting(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 border-gray-800 bg-gradient-to-br from-purple-900/10 to-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <FileText className="w-7 h-7 text-purple-400" />
              Script Writer
            </CardTitle>
            <CardDescription>
              Write scripts for movies, TV, or any creative project. Collaborate with others and link scripts to your projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Script Title</label>
                <Input
                  placeholder="Enter script title"
                  value={scriptTitle}
                  onChange={e => setScriptTitle(e.target.value)}
                  className="mb-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Script Type</label>
                <Select value={scriptType} onValueChange={setScriptType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Movie</SelectItem>
                    <SelectItem value="tv">TV Show</SelectItem>
                    <SelectItem value="theatre">Theatre</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Link to Project (optional)</label>
              <Select value={selectedProject} onValueChange={value => {
                setSelectedProject(value)
                if (value !== "custom") setCustomProjectName("")
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {mockProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {selectedProject === "custom" && (
                <Input
                  className="mt-2"
                  placeholder="Enter custom project name"
                  value={customProjectName}
                  onChange={e => setCustomProjectName(e.target.value)}
                />
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Script Content</label>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xs text-gray-400">View Mode:</span>
                <Select value={viewMode} onValueChange={v => { setViewMode(v as any); setViewStart(0) }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Page</SelectItem>
                    <SelectItem value="double">Two Pages</SelectItem>
                    <SelectItem value="quad">Four Pages</SelectItem>
                    <SelectItem value="all">All Pages</SelectItem>
                  </SelectContent>
                </Select>
                {(viewMode === 'double' && pages.length > 2) && (
                  <>
                    <Button size="sm" variant="outline" className="border-gray-700" onClick={() => setViewStart(Math.max(0, viewStart-2))} disabled={viewStart === 0}>&lt;</Button>
                    <Button size="sm" variant="outline" className="border-gray-700" onClick={() => setViewStart(Math.min(pages.length-2, viewStart+2))} disabled={viewStart+2 >= pages.length}>&gt;</Button>
                  </>
                )}
                {(viewMode === 'quad' && pages.length > 4) && (
                  <>
                    <Button size="sm" variant="outline" className="border-gray-700" onClick={() => setViewStart(Math.max(0, viewStart-4))} disabled={viewStart === 0}>&lt;</Button>
                    <Button size="sm" variant="outline" className="border-gray-700" onClick={() => setViewStart(Math.min(pages.length-4, viewStart+4))} disabled={viewStart+4 >= pages.length}>&gt;</Button>
                  </>
                )}
              </div>
              {/* Writer Tools Toolbar (above page window) */}
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                {WRITER_TOOLS.map(tool => (
                  <Button key={tool.label} size="sm" variant="outline" className="border-gray-700 text-xs" onClick={() => {
                    // Insert into all visible pages in current view
                    if (viewMode === 'single') {
                      const newPages = [...pages]
                      newPages[currentPage] = (newPages[currentPage] || '') + tool.insert
                      setPages(newPages)
                    } else if (viewMode === 'double') {
                      const newPages = [...pages]
                      for (let i = viewStart; i < Math.min(viewStart+2, pages.length); i++) {
                        newPages[i] = (newPages[i] || '') + tool.insert
                      }
                      setPages(newPages)
                    } else if (viewMode === 'quad') {
                      const newPages = [...pages]
                      for (let i = viewStart; i < Math.min(viewStart+4, pages.length); i++) {
                        newPages[i] = (newPages[i] || '') + tool.insert
                      }
                      setPages(newPages)
                    } else if (viewMode === 'all') {
                      const newPages = pages.map(p => (p || '') + tool.insert)
                      setPages(newPages)
                    }
                  }}>{tool.label}</Button>
                ))}
                {viewMode === 'single' && (
                  <Button size="sm" variant="outline" className="border-gray-700 text-green-400" onClick={() => addOverlayNote(currentPage)}>+ Overlay Note</Button>
                )}
                {viewMode === 'double' && (
                  <Button size="sm" variant="outline" className="border-gray-700 text-green-400" onClick={() => {
                    for (let i = viewStart; i < Math.min(viewStart+2, pages.length); i++) addOverlayNote(i)
                  }}>+ Overlay Note</Button>
                )}
                {viewMode === 'quad' && (
                  <Button size="sm" variant="outline" className="border-gray-700 text-green-400" onClick={() => {
                    for (let i = viewStart; i < Math.min(viewStart+4, pages.length); i++) addOverlayNote(i)
                  }}>+ Overlay Note</Button>
                )}
                {viewMode === 'all' && (
                  <Button size="sm" variant="outline" className="border-gray-700 text-green-400" onClick={() => {
                    for (let i = 0; i < pages.length; i++) addOverlayNote(i)
                  }}>+ Overlay Note</Button>
                )}
              </div>
              {/* Page navigation and rendering */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400">Page</span>
                <div className="flex gap-1">
                  {pages.map((_, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant={viewMode === 'single' && currentPage === idx ? "default" : "outline"}
                      className={viewMode === 'single' && currentPage === idx ? "bg-blue-600 text-white" : "border-gray-700 text-gray-300"}
                      onClick={() => {
                        if (viewMode === 'single') setCurrentPage(idx)
                      }}
                      disabled={viewMode !== 'single'}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" className="border-gray-700 text-green-400" onClick={() => {
                    setPages([...pages, ""])
                    if (viewMode === 'single') setCurrentPage(pages.length)
                  }}>
                    +
                  </Button>
                </div>
              </div>
              {/* Render pages according to view mode */}
              <div className="w-full flex justify-center">
                {viewMode === 'single' && (
                  <div
                    className="relative flex flex-col shadow-2xl rounded-lg border border-gray-800"
                    style={{
                      width: '680px',
                      height: '880px',
                      maxWidth: '95vw',
                      maxHeight: '80vh',
                      aspectRatio: '8.5/11',
                      boxSizing: 'border-box',
                      background: '#141414',
                    }}
                    ref={el => { overlayContainerRefs.current[currentPage] = el; pageRef.current = el; }}
                    onClick={e => {
                      // Only focus textarea if the click is directly on the background (not a child)
                      if (e.target === e.currentTarget) {
                        mainTextareaRef.current?.focus()
                      }
                    }}
                  >
                    {/* Text Tools Toolbar */}
                    <div className="text-tools-toolbar flex items-center gap-2 px-6 py-2 bg-gray-950/80 border-b border-gray-800 rounded-t-lg z-10">
                      <Text className="w-4 h-4 text-gray-400" />
                      <select
                        value={fontSize}
                        onChange={e => setFontSize(Number(e.target.value))}
                        className="bg-gray-900 text-gray-100 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none"
                        style={{ width: 56 }}
                      >
                        {[12, 14, 16, 18, 20, 24, 28, 32].map(size => (
                          <option key={size} value={size}>{size}px</option>
                        ))}
                      </select>
                      <Button size="icon" variant={isBold ? "default" : "outline"} className="border-gray-700" onClick={() => setIsBold(v => !v)} aria-label="Bold"><Bold className="w-4 h-4" /></Button>
                      <Button size="icon" variant={isItalic ? "default" : "outline"} className="border-gray-700" onClick={() => setIsItalic(v => !v)} aria-label="Italic"><Italic className="w-4 h-4" /></Button>
                      <Button size="icon" variant={isUnderline ? "default" : "outline"} className="border-gray-700" onClick={() => setIsUnderline(v => !v)} aria-label="Underline"><Underline className="w-4 h-4" /></Button>
                      <Button size="icon" variant={align === 'left' ? "default" : "outline"} className="border-gray-700" onClick={() => setAlign('left')} aria-label="Align Left"><AlignLeft className="w-4 h-4" /></Button>
                      <Button size="icon" variant={align === 'center' ? "default" : "outline"} className="border-gray-700" onClick={() => setAlign('center')} aria-label="Align Center"><AlignCenter className="w-4 h-4" /></Button>
                      <Button size="icon" variant={align === 'right' ? "default" : "outline"} className="border-gray-700" onClick={() => setAlign('right')} aria-label="Align Right"><AlignRight className="w-4 h-4" /></Button>
                      <Button size="icon" variant="outline" className="border-gray-700" aria-label="Bulleted List"><List className="w-4 h-4" /></Button>
                      <Button size="icon" variant="outline" className="border-gray-700" aria-label="Numbered List"><ListOrdered className="w-4 h-4" /></Button>
                    </div>
                    {/* Overlay Notes */}
                    {mounted && (overlayNotes[currentPage] || []).map(note => (
                      <div
                        key={note.id}
                        className={`absolute z-30 bg-gray-900 text-gray-100 rounded-xl border border-gray-700 shadow-lg p-3 min-w-[140px] min-h-[48px] flex flex-col ${editingOverlayNote && editingOverlayNote.pageIdx === currentPage && editingOverlayNote.noteId === note.id ? 'ring-2 ring-blue-500' : ''}`}
                        style={{ left: note.x, top: note.y, maxWidth: '240px' }}
                        onMouseDown={e => {
                          // Only start drag if not clicking inside textarea or inline text
                          if (
                            !(e.target instanceof HTMLTextAreaElement) &&
                            !(e.target instanceof HTMLButtonElement) &&
                            !(e.target as HTMLElement).closest('textarea')
                          ) {
                            handleDrag(currentPage, note.id, e)
                          }
                        }}
                      >
                        {editingOverlayNote && editingOverlayNote.pageIdx === currentPage && editingOverlayNote.noteId === note.id && (
                          <div className="absolute top-1 right-1 z-40 group">
                            <Button size="icon" variant="outline" aria-label="Delete note"
                              className="border-gray-700 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={e => { e.stopPropagation(); deleteOverlayNote(currentPage, note.id) }}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {editingOverlayNote && editingOverlayNote.pageIdx === currentPage && editingOverlayNote.noteId === note.id ? (
                          <textarea
                            ref={overlayEditRef}
                            value={note.content}
                            onChange={e => updateOverlayNote(currentPage, note.id, { content: e.target.value })}
                            onBlur={() => setEditingOverlayNote(null)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                setEditingOverlayNote(null);
                              }
                            }}
                            className="w-full h-full bg-transparent text-sm outline-none resize-none font-medium"
                            style={{ minHeight: 32 }}
                            placeholder="Overlay note..."
                          />
                        ) : (
                          <div
                            className="w-full min-h-[32px] text-sm font-medium cursor-text"
                            onClick={e => { e.stopPropagation(); setEditingOverlayNote({ pageIdx: currentPage, noteId: note.id }) }}
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Enter') setEditingOverlayNote({ pageIdx: currentPage, noteId: note.id })
                            }}
                            style={{ whiteSpace: 'pre-wrap', outline: 'none' }}
                          >
                            {note.content || <span className="text-gray-500">Overlay note...</span>}
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Page Number Bottom Left */}
                    <div className="absolute bottom-4 left-6 text-xs text-gray-400 font-mono select-none">Page {currentPage + 1}</div>
                  </div>
                )}
                {viewMode === 'double' && (
                  <div className="flex gap-4">
                    {[0,1].map(i => {
                      const pageIdx = viewStart + i
                      if (pageIdx >= pages.length) return null
                      return (
                        <div
                          key={pageIdx}
                          className="relative flex items-center justify-center shadow-2xl rounded-lg bg-gray-900 border border-gray-800"
                          style={{
                            width: '340px',
                            height: '440px',
                            maxWidth: '48vw',
                            maxHeight: '40vh',
                            aspectRatio: '8.5/11',
                            boxSizing: 'border-box',
                          }}
                        >
                          <textarea
                            placeholder={`Page ${pageIdx + 1}`}
                            value={pages[pageIdx]}
                            onChange={e => {
                              const newPages = [...pages]
                              newPages[pageIdx] = e.target.value
                              setPages(newPages)
                            }}
                            className="w-full h-full resize-none font-mono text-base text-gray-100 border-none outline-none rounded-md p-4"
                            style={{
                              minHeight: 0,
                              minWidth: 0,
                              boxShadow: 'none',
                              background: '#141414',
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
                {viewMode === 'quad' && (
                  <div className="grid grid-cols-2 gap-4">
                    {[0,1,2,3].map(i => {
                      const pageIdx = viewStart + i
                      if (pageIdx >= pages.length) return null
                      return (
                        <div
                          key={pageIdx}
                          className="relative flex items-center justify-center shadow-2xl rounded-lg bg-gray-900 border border-gray-800"
                          style={{
                            width: '340px',
                            height: '440px',
                            maxWidth: '48vw',
                            maxHeight: '40vh',
                            aspectRatio: '8.5/11',
                            boxSizing: 'border-box',
                          }}
                        >
                          <textarea
                            placeholder={`Page ${pageIdx + 1}`}
                            value={pages[pageIdx]}
                            onChange={e => {
                              const newPages = [...pages]
                              newPages[pageIdx] = e.target.value
                              setPages(newPages)
                            }}
                            className="w-full h-full resize-none font-mono text-base text-gray-100 border-none outline-none rounded-md p-4"
                            style={{
                              minHeight: 0,
                              minWidth: 0,
                              boxShadow: 'none',
                              background: '#141414',
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
                {viewMode === 'all' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {pages.map((page, pageIdx) => (
                      <div
                        key={pageIdx}
                        className="relative flex items-center justify-center shadow-2xl rounded-lg bg-gray-900 border border-gray-800"
                        style={{
                          width: '220px',
                          height: '285px',
                          maxWidth: '24vw',
                          maxHeight: '22vh',
                          aspectRatio: '8.5/11',
                          boxSizing: 'border-box',
                        }}
                      >
                        <textarea
                          placeholder={`Page ${pageIdx + 1}`}
                          value={pages[pageIdx]}
                          onChange={e => {
                            const newPages = [...pages]
                            newPages[pageIdx] = e.target.value
                            setPages(newPages)
                          }}
                          className="w-full h-full resize-none font-mono text-base text-gray-100 border-none outline-none rounded-md p-2"
                          style={{
                            minHeight: 0,
                            minWidth: 0,
                            boxShadow: 'none',
                            background: '#141414',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button onClick={handleSaveScript} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                <Send className="w-4 h-4 mr-2" /> Save Script
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Collaboration Section */}
        <Card className="border-gray-800 bg-gradient-to-br from-blue-900/10 to-purple-900/10 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Users className="w-6 h-6 text-blue-400" />
              Collaborators
            </CardTitle>
            <CardDescription>
              Invite others to collaborate on this script. (Collaboration is currently a mock, backend integration coming soon.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
              <Input
                placeholder="Invite by email..."
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="bg-gradient-to-r from-blue-500 to-purple-500">
                <UserPlus className="w-4 h-4 mr-2" />
                {inviting ? "Inviting..." : "Invite"}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {collaborators.map(collab => (
                <div key={collab.id} className="flex items-center gap-3 p-2 rounded bg-gray-900 border border-gray-800">
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-lg font-bold text-blue-300">
                    {collab.avatar}
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${collab.active ? 'bg-green-500' : 'bg-gray-500'}`}
                      title={collab.active ? 'Active' : 'Inactive'}
                    />
                  </div>
                  <span className="text-gray-200">{collab.name}</span>
                  <span className={`ml-auto text-xs font-semibold ${collab.active ? 'text-green-400' : 'text-gray-400'}`}>{collab.active ? 'Active' : 'Inactive'}</span>
                </div>
              ))}
              {collaborators.length === 0 && (
                <div className="text-gray-400">No collaborators yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Version History Section */}
        <Card className="border-gray-800 bg-gradient-to-br from-gray-900/10 to-gray-800/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              Version History
            </CardTitle>
            <CardDescription>
              Every time you save, a new version is stored. You can view or restore previous versions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {versionHistory.length === 0 ? (
              <div className="text-gray-400">No versions saved yet.</div>
            ) : (
              <div className="space-y-2">
                {versionHistory.map((ver, idx) => (
                  <div key={ver.timestamp} className="flex items-center gap-3 p-2 rounded bg-gray-900 border border-gray-800">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-200">{ver.title || 'Untitled Script'}</div>
                      <div className="text-xs text-gray-400">{new Date(ver.timestamp).toLocaleString()}</div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-gray-700 text-blue-400">View</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Version Preview</DialogTitle>
                          <DialogDescription>
                            {ver.title || 'Untitled Script'}<br/>
                            Saved: {new Date(ver.timestamp).toLocaleString()}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-96 overflow-auto bg-gray-900 rounded p-4 mt-2">
                          {ver.pages.map((p, i) => (
                            <div key={i} className="mb-6">
                              <div className="text-xs text-gray-400 mb-1">Page {i+1}</div>
                              <pre className="whitespace-pre-wrap text-gray-100 bg-[#141414] rounded p-3">{p}</pre>
                            </div>
                          ))}
                        </div>
                        <DialogFooter>
                          <Button onClick={() => {
                            setPages([...ver.pages])
                            setScriptTitle(ver.title)
                            setScriptType(ver.scriptType)
                            setSelectedProject(ver.project)
                            setCustomProjectName(ver.customProjectName)
                          }}>Restore This Version</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card className="border-gray-800 bg-gradient-to-br from-blue-900/10 to-purple-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              Notes
            </CardTitle>
            <CardDescription>
              Jot down ideas, reminders, or anything related to your script. Notes are private and saved locally.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Textarea
                placeholder="Add a new note..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                className="flex-1 min-h-[48px]"
              />
              <Button onClick={handleAddNote} className="bg-gradient-to-r from-blue-500 to-purple-500">Add</Button>
            </div>
            {notes.length === 0 ? (
              <div className="text-gray-400">No notes yet.</div>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="flex items-start gap-3 p-2 rounded bg-gray-900 border border-gray-800">
                    <Textarea
                      value={note.content}
                      onChange={e => handleEditNote(note.id, e.target.value)}
                      className="flex-1 min-h-[40px] text-sm bg-[#141414] text-gray-100 border-none outline-none"
                    />
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-400">{new Date(note.timestamp).toLocaleString()}</span>
                      <Button size="sm" variant="outline" className="border-gray-700 text-red-400" onClick={() => handleDeleteNote(note.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 