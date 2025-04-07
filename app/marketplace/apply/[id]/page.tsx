"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BanknoteIcon as Bank,
  CreditCard,
  Bitcoin,
  DollarSign,
  Send,
  Pen,
  Check,
  X,
  ArrowLeft,
  Upload,
  FileText,
} from "lucide-react"
import { createBrowserClient } from '@supabase/ssr'
import { MarketplaceOpportunity } from "@/app/types/marketplace"

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const opportunityId = params.id as string
  const [loading, setLoading] = useState(true)
  const [opportunity, setOpportunity] = useState<MarketplaceOpportunity | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [formData, setFormData] = useState({
    investmentAmount: "",
    message: "",
  })
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([])
  const [isSigning, setIsSigning] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formComplete, setFormComplete] = useState({
    details: false,
    documents: false,
    signature: false,
  })
  const [paymentMethod, setPaymentMethod] = useState("bank")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchOpportunity()
  }, [opportunityId])

  const fetchOpportunity = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single()

      if (error) throw error

      if (data) {
        setOpportunity(data)
      } else {
        router.push("/marketplace")
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error)
      router.push("/marketplace")
    } finally {
      setLoading(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Check if details are complete
    if (name === "investmentAmount" || name === "message") {
      const detailsComplete =
        formData.investmentAmount !== "" && Number(formData.investmentAmount) >= (opportunity?.budget || 0)

      setFormComplete((prev) => ({ ...prev, details: detailsComplete }))
    }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setUploadedDocuments((prev) => [...prev, ...newFiles])
      setFormComplete((prev) => ({ ...prev, documents: true }))
    }
  }

  // Handle signature canvas
  const initializeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineWidth = 2
    ctx.strokeStyle = "#ffffff"
    ctx.lineCap = "round"
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)

    // Get position
    let x, y
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.nativeEvent.offsetX
      y = e.nativeEvent.offsetY
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get position
    let x, y
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.nativeEvent.offsetX
      y = e.nativeEvent.offsetY
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.closePath()
    setIsDrawing(false)

    // Save signature as data URL
    const dataUrl = canvas.toDataURL("image/png")
    setSignature(dataUrl)
    setFormComplete((prev) => ({ ...prev, signature: true }))
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignature(null)
    setFormComplete((prev) => ({ ...prev, signature: false }))
  }

  // Initialize canvas when signature tab is active
  useEffect(() => {
    if (activeTab === "signature") {
      initializeCanvas()
    }
  }, [activeTab])

  // Check if all required form sections are complete
  const checkFormCompletion = () => {
    const detailsComplete =
      formData.investmentAmount !== "" &&
      Number(formData.investmentAmount) >= (opportunity?.budget || 0) &&
      paymentMethod !== ""

    setFormComplete((prev) => ({
      ...prev,
      details: detailsComplete,
    }))
  }

  // Update form completion when payment method changes
  useEffect(() => {
    checkFormCompletion()
  }, [paymentMethod, formData.investmentAmount, opportunity?.budget])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)

    try {
      // In a real app, this would be an API call to submit the application
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect to success page or show success message
      router.push("/marketplace?success=true")
    } catch (error) {
      console.error("Error submitting application:", error)
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading opportunity details...</p>
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Opportunity Not Found</h2>
          <p className="mb-4">The investment opportunity you're looking for doesn't exist or has been removed.</p>
          <Button asChild className="gradient-button">
            <Link href="/marketplace">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/marketplace"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back to Marketplace
            </Link>
            <h1 className="text-3xl font-bold">Apply for Investment Opportunity</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Opportunity Overview */}
        <Card className="leonardo-card border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{opportunity.title}</CardTitle>
            <CardDescription className="text-gray-400">{opportunity.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <span className="text-gray-400 text-sm">Category:</span>
                <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/50 border">
                  {opportunity.category}
                </Badge>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Project Type:</span>
                <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/50 border">
                  {opportunity.project_type}
                </Badge>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Budget:</span>
                <span className="ml-2 font-medium">
                  ${opportunity.budget.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Applications</span>
                <span className="text-white">{opportunity.applications_count}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: "0%" }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="leonardo-tabs">
              <TabsTrigger value="details" className="leonardo-tab">
                <DollarSign className="w-4 h-4 mr-2" />
                Investment Details
              </TabsTrigger>
              <TabsTrigger value="documents" className="leonardo-tab">
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="signature" className="leonardo-tab">
                <Pen className="w-4 h-4 mr-2" />
                Signature
              </TabsTrigger>
            </TabsList>

            {/* Investment Details Tab */}
            <TabsContent value="details">
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle>Investment Details</CardTitle>
                  <CardDescription className="text-gray-400">Provide information about your investment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="investmentAmount">Investment Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        id="investmentAmount"
                        name="investmentAmount"
                        type="number"
                        placeholder={`Min: $${opportunity.budget.toLocaleString()}`}
                        className="leonardo-input pl-10"
                        value={formData.investmentAmount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Minimum investment: ${opportunity.budget.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="space-y-2">
                      <div
                        className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
                          paymentMethod === "bank"
                            ? "bg-blue-500/20 border-blue-500/50"
                            : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50"
                        }`}
                        onClick={() => setPaymentMethod("bank")}
                      >
                        <Bank
                          className={`w-5 h-5 mr-3 ${paymentMethod === "bank" ? "text-blue-400" : "text-gray-400"}`}
                        />
                        <div>
                          <p className="font-medium">Bank Transfer</p>
                          <p className="text-xs text-gray-400">Direct bank transfer</p>
                        </div>
                        {paymentMethod === "bank" && <Check className="ml-auto text-blue-400 w-5 h-5" />}
                      </div>

                      <div
                        className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
                          paymentMethod === "card"
                            ? "bg-blue-500/20 border-blue-500/50"
                            : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50"
                        }`}
                        onClick={() => setPaymentMethod("card")}
                      >
                        <CreditCard
                          className={`w-5 h-5 mr-3 ${paymentMethod === "card" ? "text-blue-400" : "text-gray-400"}`}
                        />
                        <div>
                          <p className="font-medium">Credit Card</p>
                          <p className="text-xs text-gray-400">Visa, Mastercard, American Express</p>
                        </div>
                        {paymentMethod === "card" && <Check className="ml-auto text-blue-400 w-5 h-5" />}
                      </div>

                      <div
                        className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
                          paymentMethod === "crypto"
                            ? "bg-blue-500/20 border-blue-500/50"
                            : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50"
                        }`}
                        onClick={() => setPaymentMethod("crypto")}
                      >
                        <Bitcoin
                          className={`w-5 h-5 mr-3 ${paymentMethod === "crypto" ? "text-blue-400" : "text-gray-400"}`}
                        />
                        <div>
                          <p className="font-medium">Cryptocurrency</p>
                          <p className="text-xs text-gray-400">BTC, ETH, USDC accepted</p>
                        </div>
                        {paymentMethod === "crypto" && <Check className="ml-auto text-blue-400 w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Share why you're interested in this opportunity..."
                      className="leonardo-input min-h-[120px]"
                      value={formData.message}
                      onChange={handleInputChange}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-700 bg-gray-800/30 text-white"
                    onClick={() => router.push("/marketplace")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="gradient-button"
                    onClick={() => setActiveTab("documents")}
                    disabled={
                      !formData.investmentAmount ||
                      Number(formData.investmentAmount) < opportunity.budget ||
                      !paymentMethod
                    }
                  >
                    Continue to Documents
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                  <CardDescription className="text-gray-400">
                    Upload the necessary documents for your application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fileUpload">Upload Files</Label>
                    <div className="border-2 border-dashed border-gray-700 rounded-md p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400 mb-2">Drag and drop files here, or click to select files</p>
                      <Input id="fileUpload" type="file" multiple className="hidden" onChange={handleFileUpload} />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-700 bg-gray-800/30 text-white"
                        onClick={() => document.getElementById("fileUpload")?.click()}
                      >
                        Select Files
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-700 bg-gray-800/30 text-white"
                    onClick={() => setActiveTab("details")}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="gradient-button"
                    onClick={() => setActiveTab("signature")}
                    disabled={uploadedDocuments.length === 0}
                  >
                    Continue to Signature
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Signature Tab */}
            <TabsContent value="signature">
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle>Digital Signature</CardTitle>
                  <CardDescription className="text-gray-400">
                    Sign your application to confirm your investment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Your Signature</Label>
                    <div className="border border-gray-700 rounded-md p-4">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={200}
                        className="w-full h-[200px] bg-gray-900 rounded-md cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-800/30 text-white"
                          onClick={clearSignature}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 p-4 rounded-md border border-gray-700">
                    <p className="text-sm text-gray-400">By signing this application, you confirm that:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-gray-400">
                      <li>All information provided is accurate and complete</li>
                      <li>You understand the risks associated with this investment</li>
                      <li>You meet the minimum investment requirements</li>
                      <li>You agree to the terms and conditions of this investment opportunity</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-700 bg-gray-800/30 text-white"
                    onClick={() => setActiveTab("documents")}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="gradient-button" disabled={isSubmitting || !signature}>
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </main>
    </div>
  )
}

