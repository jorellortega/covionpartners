"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Download,
  Share2,
  Briefcase,
  HandshakeIcon,
  Users,
  TrendingUp,
  ChevronRight,
  Edit,
  Check,
  ChevronLeft,
  ChevronRightIcon,
  ExternalLink,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useProjects } from "@/hooks/useProjects"
import { useDeals } from "@/hooks/useDeals"
import { useAuth } from "@/hooks/useAuth"
import { Project as ProjectType, MediaFile } from '@/types'
import html2canvas from "html2canvas"

interface Project extends ProjectType {
  promo_title?: string
  promo_description?: string
  media_files?: MediaFile[]
  name: string
  description: string
  id: string
}

type PreviewFormat = {
  id: string;
  name: string;
  aspectRatio: string;
  width: number;
  height: number;
  description: string;
}

const PREVIEW_FORMATS: PreviewFormat[] = [
  {
    id: 'post-square',
    name: 'Instagram Post',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    description: 'Perfect for Instagram posts'
  },
  {
    id: 'story',
    name: 'Story/Reel',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    description: 'For Instagram/Facebook stories and reels'
  },
  {
    id: 'landscape',
    name: 'Landscape',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Best for LinkedIn and Twitter'
  },
  {
    id: 'portrait',
    name: 'Portrait',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    description: 'Optimal for Instagram portrait posts'
  }
];

export default function MarketingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading } = useProjects(user?.id || '')
  const { deals } = useDeals()
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [promoTitle, setPromoTitle] = useState("")
  const [promoDescription, setPromoDescription] = useState("")
  const [editingPromo, setEditingPromo] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showQRCodes, setShowQRCodes] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('showQRCodes') === 'true';
    }
    return true;
  });
  const [previewScale, setPreviewScale] = useState(1)
  const [selectedFormat, setSelectedFormat] = useState<PreviewFormat>(PREVIEW_FORMATS[0]);
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showQRCodes', showQRCodes.toString());
    }
  }, [showQRCodes]);

  // Update scale on format change and window resize
  useEffect(() => {
    const updateScale = () => {
      const scale = Math.min(
        1,
        Math.min(
          (window.innerWidth * 0.8) / selectedFormat.width,
          (window.innerHeight * 0.6) / selectedFormat.height
        )
      )
      setPreviewScale(scale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [selectedFormat])

  console.log('Projects:', projects) // Debug log

  const selectedProjectData = projects.find(p => p.id === selectedProject) as Project | undefined

  const handleSavePromo = async () => {
    if (!selectedProject) return
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          promo_title: promoTitle,
          promo_description: promoDescription,
        })
        .eq('id', selectedProject)

      if (error) throw error
      setEditingPromo(false)
    } catch (error) {
      console.error('Error saving promo:', error)
    }
  }

  const handlePrevImage = () => {
    if (selectedProjectData?.media_files) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedProjectData.media_files!.length - 1 : prev - 1
      )
    }
  }

  const handleNextImage = () => {
    if (selectedProjectData?.media_files) {
      setCurrentImageIndex((prev) => 
        prev === selectedProjectData.media_files!.length - 1 ? 0 : prev + 1
      )
    }
  }

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `covion-promo-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Covion Partners Marketing',
          text: 'Check out this amazing content from Covion Partners!',
          url: imageUrl,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.origin + imageUrl)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 mb-4">
            Transform Your Business
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover how Covion Partners can help you manage projects, close deals, and grow your business.
          </p>
        </div>

        {/* Project Selection */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Project Marketing</h2>
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Select Project to Promote</CardTitle>
              <CardDescription className="text-gray-400">
                {loading ? "Loading projects..." : projects.length === 0 ? "No projects found" : "Choose a project to create or edit promotional content"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-gray-400">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="text-gray-400">No projects available</div>
              ) : (
                <Select
                  value={selectedProject || ""}
                  onValueChange={(value) => {
                    setSelectedProject(value)
                    const project = projects.find(p => p.id === value)
                    setPromoTitle(project?.promo_title || project?.name || "")
                    setPromoDescription(project?.promo_description || project?.description || "")
                  }}
                >
                  <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {projects.map((project) => (
                      <SelectItem 
                        key={project.id} 
                        value={project.id}
                        className="text-white hover:bg-purple-900/20 hover:text-purple-400 focus:bg-purple-900/20 focus:text-purple-400"
                      >
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Promotional Editor */}
        {selectedProject && (
          <div className="mb-16">
            <Card className="leonardo-card border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-white">Promotional Content</CardTitle>
                  <CardDescription className="text-gray-400">
                    Customize how your project appears in marketing materials
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  onClick={() => setEditingPromo(!editingPromo)}
                >
                  {editingPromo ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Promotional Title
                  </label>
                  <Input
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    disabled={!editingPromo}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="Enter a catchy title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Promotional Description
                  </label>
                  <Textarea
                    value={promoDescription}
                    onChange={(e) => setPromoDescription(e.target.value)}
                    disabled={!editingPromo}
                    className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
                    placeholder="Describe your project in an engaging way"
                  />
                </div>
                {editingPromo && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                      onClick={() => setEditingPromo(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="gradient-button"
                      onClick={handleSavePromo}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Section */}
        {selectedProject && (
          <div className="mb-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white">Preview</h2>
              <Select
                value={selectedFormat.id}
                onValueChange={(value) => {
                  const format = PREVIEW_FORMATS.find(f => f.id === value);
                  if (format) setSelectedFormat(format);
                }}
              >
                <SelectTrigger className="w-[200px] bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {PREVIEW_FORMATS.map((format) => (
                    <SelectItem 
                      key={format.id} 
                      value={format.id}
                      className="text-white hover:bg-purple-900/20 hover:text-purple-400"
                    >
                      <div className="flex flex-col">
                        <span>{format.name}</span>
                        <span className="text-xs text-gray-400">{format.aspectRatio} - {format.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Card className="leonardo-card border-gray-800 overflow-hidden">
              <div className="flex justify-center p-4 bg-gray-900/50">
                <div 
                  className="relative preview-content bg-[#0F1117] overflow-hidden"
                  style={{
                    width: `${selectedFormat.width}px`,
                    height: `${selectedFormat.height}px`,
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top center',
                  }}
                >
                  {/* Content wrapper with absolute positioning to maintain aspect ratio */}
                  <div className="absolute inset-0 flex flex-col">
                    {/* Header section - adjusts size based on format */}
                    <div 
                      className="flex flex-col items-center justify-center"
                      style={{
                        padding: selectedFormat.id === 'story' ? '64px 24px' : '32px 24px',
                        height: selectedFormat.id === 'story' ? '45%' : '50%'
                      }}
                    >
                      <div 
                        className="flex items-center justify-center gap-3 mb-4"
                        style={{
                          transform: `scale(${selectedFormat.id === 'story' ? 0.8 : 1})`
                        }}
                      >
                        <HandshakeIcon className="w-8 h-8 text-purple-400" />
                        <h2 className="text-2xl font-bold text-purple-400">Covion Partners</h2>
                      </div>
                      <h3 
                        className="font-bold text-white text-center mb-4 mx-auto leading-tight px-4"
                        style={{
                          fontSize: selectedFormat.id === 'story' ? '2rem' : 
                                   selectedFormat.id === 'landscape' ? '3rem' : '2.5rem',
                          maxWidth: selectedFormat.id === 'story' ? '90%' : '80%'
                        }}
                      >
                        {promoTitle}
                      </h3>
                      <p 
                        className="text-gray-300 text-center mx-auto leading-relaxed px-4"
                        style={{
                          fontSize: selectedFormat.id === 'story' ? '1rem' : 
                                   selectedFormat.id === 'landscape' ? '1.25rem' : '1.125rem',
                          maxWidth: selectedFormat.id === 'story' ? '95%' : '85%',
                          display: '-webkit-box',
                          WebkitLineClamp: selectedFormat.id === 'story' ? 4 : 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {promoDescription}
                      </p>
                    </div>

                    {/* Media section - takes remaining height */}
                    <div className="relative flex-1">
                      {selectedProjectData?.media_files && selectedProjectData.media_files.length > 0 ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={selectedProjectData.media_files[currentImageIndex].url}
                            alt={selectedProjectData.media_files[currentImageIndex].name}
                            fill
                            className="object-cover"
                            sizes={`${selectedFormat.width}px`}
                          />
                          {selectedProjectData.media_files.length > 1 && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-900/50 border-gray-700 hover:bg-purple-900/20 hover:text-purple-400 z-10"
                                onClick={handlePrevImage}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900/50 border-gray-700 hover:bg-purple-900/20 hover:text-purple-400 z-10"
                                onClick={handleNextImage}
                              >
                                <ChevronRightIcon className="h-4 w-4" />
                              </Button>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                {selectedProjectData.media_files.map((_, index) => (
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
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-900 to-pink-900 flex items-center justify-center">
                          <span className="text-xl text-gray-400">No media available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-800">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDownloading}
                    className="flex-1 sm:flex-none border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                    onClick={async () => {
                      try {
                        setIsDownloading(true)
                        const element = document.querySelector('.preview-content') as HTMLElement
                        if (!element) {
                          console.error('Preview element not found')
                          alert('Could not find preview content')
                          return
                        }

                        // Store original styles
                        const originalStyles = {
                          transform: element.style.transform,
                          width: element.style.width,
                          height: element.style.height
                        }

                        // Set exact dimensions for capture
                        element.style.transform = 'none'
                        element.style.width = `${selectedFormat.width}px`
                        element.style.height = `${selectedFormat.height}px`

                        console.log('Starting image capture...')
                        const canvas = await html2canvas(element, {
                          width: selectedFormat.width,
                          height: selectedFormat.height,
                          scale: 2,
                          useCORS: true,
                          allowTaint: true,
                          backgroundColor: '#0F1117',
                          logging: true // Enable logging for debugging
                        })
                        console.log('Image capture completed')

                        // Restore original styles
                        element.style.transform = originalStyles.transform
                        element.style.width = originalStyles.width
                        element.style.height = originalStyles.height

                        try {
                          console.log('Converting to data URL...')
                          const imageUrl = canvas.toDataURL('image/png')
                          console.log('Data URL created')

                          // Create and trigger download
                          const link = document.createElement('a')
                          const fileName = `${promoTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${selectedFormat.id}.png`
                          console.log('Downloading as:', fileName)
                          
                          link.download = fileName
                          link.href = imageUrl
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                          console.log('Download triggered')
                        } catch (dataUrlError) {
                          console.error('Error creating data URL:', dataUrlError)
                          alert('Failed to create downloadable image. Please try again.')
                        }
                      } catch (error) {
                        console.error('Error in download process:', error)
                        alert('Failed to generate preview. Please try again.')
                      } finally {
                        setIsDownloading(false)
                      }
                    }}
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download {selectedFormat.name}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/livepromo/${selectedProject}`
                      navigator.clipboard.writeText(shareUrl)
                      alert('Promotional link copied to clipboard!')
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Project
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                    onClick={() => router.push(`/livepromo/${selectedProject}`)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Live
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Call to Action */}
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
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Toggle UI */}
        <div className="flex items-center gap-2 mb-6">
          <label htmlFor="showQRCodes" className="text-sm font-medium text-gray-300">
            Show QR Codes on Project Pages
          </label>
          <input
            id="showQRCodes"
            type="checkbox"
            checked={showQRCodes}
            onChange={e => setShowQRCodes(e.target.checked)}
            className="ml-2"
          />
        </div>
      </main>

      <style jsx global>{`
        .preview-content {
          --dynamic-scale: min(
            1,
            min(
              calc(100vw / ${selectedFormat.width}),
              calc(80vh / ${selectedFormat.height})
            )
          );
        }
      `}</style>
    </div>
  )
} 