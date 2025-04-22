"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import Image from "next/image"
import { 
  HandshakeIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronRightIcon,
  Share2,
  Download,
  ExternalLink,
  QrCode,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from "sonner"

interface Project {
  id: string
  name: string
  description: string
  promo_title: string
  promo_description: string
  media_files: Array<{
    url: string
    name: string
  }>
}

export default function LivePromoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            promo_title,
            promo_description,
            media_files
          `)
          .eq('id', resolvedParams.id)
          .single()

        if (error) throw error
        setProject(data)
      } catch (error) {
        console.error('Error fetching project:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [resolvedParams.id])

  const handlePrevImage = () => {
    if (project?.media_files) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? project.media_files.length - 1 : prev - 1
      )
    }
  }

  const handleNextImage = () => {
    if (project?.media_files) {
      setCurrentImageIndex((prev) => 
        prev === project.media_files.length - 1 ? 0 : prev + 1
      )
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: project?.promo_title || project?.name || 'Covion Partners Project',
          text: project?.promo_description || project?.description,
          url: shareUrl,
        })
      } catch (error) {
        console.error('Error sharing:', error)
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Link copied to clipboard!')
      }
    } else {
      // Fallback for browsers that don't support share API
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleQRDownload = () => {
    const canvas = document.getElementById('project-qr-code') as HTMLCanvasElement
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `covion-project-${project?.id}-qr.png`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Project not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card className="leonardo-card border-gray-800 overflow-hidden">
          <div className="relative">
            <div className="p-12 border-b border-gray-800 bg-[#0F1117]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <HandshakeIcon className="w-8 h-8 text-purple-400" />
                  <h2 className="text-2xl font-bold text-purple-400">Covion Partners</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-purple-400"
                    onClick={handleShare}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-purple-400"
                    onClick={() => setShowQR(!showQR)}
                  >
                    <QrCode className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-purple-400"
                    onClick={() => router.push(`/publicprojects/${project?.id}`)}
                  >
                    <Info className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <h3 className="text-5xl md:text-6xl font-bold text-white text-center mb-8 mx-auto max-w-4xl leading-tight">
                {project.promo_title || project.name}
              </h3>
              <p className="text-xl text-gray-300 text-center max-w-2xl mx-auto leading-relaxed">
                {project.promo_description || project.description}
              </p>
            </div>

            {project.media_files && project.media_files.length > 0 ? (
              <div className="aspect-video relative">
                <div className="relative w-full h-full">
                  <Image
                    src={project.media_files[currentImageIndex].url}
                    alt={project.media_files[currentImageIndex].name}
                    fill
                    className="object-cover"
                  />
                  {project.media_files.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-900/50 border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                        onClick={handlePrevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900/50 border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                        onClick={handleNextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {project.media_files.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex
                                ? "bg-purple-400"
                                : "bg-gray-600"
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="aspect-video relative bg-gradient-to-r from-purple-900 to-pink-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl text-gray-400">No media available</span>
                </div>
              </div>
            )}

            {showQR && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                <div className="bg-gray-900 p-8 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-white">Project QR Code</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-purple-400"
                      onClick={() => setShowQR(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <QRCodeCanvas
                      id="project-qr-code"
                      value={`${window.location.origin}/publicprojects/${project.id}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <Button
                    className="w-full gradient-button"
                    onClick={handleQRDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-800">
            <div className="flex flex-wrap gap-3">
              <Button
                className="flex-1 sm:flex-none gradient-button"
                onClick={() => router.push(`/publicprojects/${project.id}`)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Project Details
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Project
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                onClick={() => setShowQR(true)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Show QR Code
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-16 text-center">
          <Card className="leonardo-card border-gray-800 max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">Ready to Get Started?</CardTitle>
              <CardDescription className="text-gray-400">
                Join Covion Partners today and take your business to the next level.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="gradient-button"
                onClick={() => router.push('/account-types')}
              >
                Get Started
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 