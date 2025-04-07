"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, BarChart2, DollarSign, TrendingUp, Calendar, Download } from "lucide-react"

// Donut chart component
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const startAngle = cumulativePercentage * 3.6 // 3.6 = 360 / 100
          cumulativePercentage += percentage
          const endAngle = cumulativePercentage * 3.6

          // Calculate the SVG path for the donut segment
          const x1 = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180))
          const y1 = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180))
          const x2 = 50 + 40 * Math.cos((endAngle - 90) * (Math.PI / 180))
          const y2 = 50 + 40 * Math.sin((endAngle - 90) * (Math.PI / 180))

          const largeArcFlag = percentage > 50 ? 1 : 0

          const pathData = [`M 50 50`, `L ${x1} ${y1}`, `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(" ")

          return <path key={index} d={pathData} fill={item.color} stroke="#13131a" strokeWidth="1" />
        })}
        <circle cx="50" cy="50" r="25" fill="#13131a" />
      </svg>
    </div>
  )
}

// Bar chart component
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const maxValue = Math.max(...data.map((item) => item.value))

  return (
    <div className="w-full h-64 flex items-end space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${(item.value / maxValue) * 80}%`,
              minHeight: "20px",
              background: item.color,
            }}
          ></div>
          <div className="mt-2 text-xs text-gray-400">{item.label}</div>
          <div className="mt-1 text-sm font-medium">${item.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}

export default function ProjectFinancialsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("project")
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId)
  const [selectedTimeframe, setSelectedTimeframe] = useState("year")

  // Mock projects data
  const projects = [
    { id: "proj-001", name: "AI Integration Platform" },
    { id: "proj-002", name: "Mobile App Development" },
    { id: "proj-003", name: "E-commerce Platform Redesign" },
    { id: "proj-004", name: "Data Analytics Dashboard" },
    { id: "proj-005", name: "Blockchain Integration" },
  ]

  // Mock financial data
  const financialData = {
    totalBudget: 7500000,
    spent: 4875000,
    remaining: 2625000,
    roi: 22,
    expenses: [
      { label: "Development", value: 2500000, color: "#4f46e5" },
      { label: "Marketing", value: 1000000, color: "#8b5cf6" },
      { label: "Operations", value: 875000, color: "#ec4899" },
      { label: "Research", value: 500000, color: "#06b6d4" },
    ],
    monthlySpending: [
      { label: "Jan", value: 350000, color: "#4f46e5" },
      { label: "Feb", value: 420000, color: "#4f46e5" },
      { label: "Mar", value: 380000, color: "#4f46e5" },
      { label: "Apr", value: 450000, color: "#4f46e5" },
      { label: "May", value: 520000, color: "#4f46e5" },
      { label: "Jun", value: 480000, color: "#4f46e5" },
    ],
    projections: {
      revenue: 12500000,
      costs: 5000000,
      profit: 7500000,
      breakEvenDate: "2025-09-15",
    },
  }

  // Update selected project when projectId changes
  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId)
    }
  }, [projectId])

  // Handle project selection change
  const handleProjectChange = (value: string) => {
    setSelectedProject(value)
    router.push(`/projects/financials?project=${value}`)
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/projects"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back to Projects
            </Link>
            <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          </div>
          <Button className="gradient-button">
            <Download className="w-5 h-5 mr-2" />
            Export Report
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Project Selector */}
        <Card className="leonardo-card border-gray-800 mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-400 mb-1">Select Project</label>
                <Select value={selectedProject || ""} onValueChange={handleProjectChange}>
                  <SelectTrigger className="leonardo-input">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Timeframe</label>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger className="leonardo-input w-[180px]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedProject ? (
          <>
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="leonardo-card border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-500/20 mr-4">
                      <DollarSign className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Budget</p>
                      <h3 className="text-2xl font-bold">${financialData.totalBudget.toLocaleString()}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="leonardo-card border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-500/20 mr-4">
                      <BarChart2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Spent</p>
                      <h3 className="text-2xl font-bold">${financialData.spent.toLocaleString()}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="leonardo-card border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-500/20 mr-4">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Remaining</p>
                      <h3 className="text-2xl font-bold">${financialData.remaining.toLocaleString()}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="leonardo-card border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-pink-500/20 mr-4">
                      <TrendingUp className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Projected ROI</p>
                      <h3 className="text-2xl font-bold">{financialData.roi}%</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for different financial views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="leonardo-tabs">
                <TabsTrigger value="overview" className="leonardo-tab">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="expenses" className="leonardo-tab">
                  Expenses
                </TabsTrigger>
                <TabsTrigger value="projections" className="leonardo-tab">
                  Projections
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="leonardo-card border-gray-800">
                    <CardHeader>
                      <CardTitle>Budget Allocation</CardTitle>
                      <CardDescription className="text-gray-400">
                        Breakdown of how the budget is allocated
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DonutChart data={financialData.expenses} />
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        {financialData.expenses.map((item, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm text-gray-400">{item.label}:</span>
                            <span className="ml-1 text-sm font-medium">${item.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="leonardo-card border-gray-800">
                    <CardHeader>
                      <CardTitle>Monthly Spending</CardTitle>
                      <CardDescription className="text-gray-400">
                        Spending trends over the past 6 months
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BarChart data={financialData.monthlySpending} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Expenses Tab */}
              <TabsContent value="expenses">
                <Card className="leonardo-card border-gray-800">
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription className="text-gray-400">
                      Detailed breakdown of all project expenses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="text-left py-3 px-4">Category</th>
                            <th className="text-left py-3 px-4">Amount</th>
                            <th className="text-left py-3 px-4">Percentage</th>
                            <th className="text-left py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialData.expenses.map((expense, index) => (
                            <tr key={index} className="border-b border-gray-800">
                              <td className="py-3 px-4">{expense.label}</td>
                              <td className="py-3 px-4">${expense.value.toLocaleString()}</td>
                              <td className="py-3 px-4">
                                {((expense.value / financialData.totalBudget) * 100).toFixed(1)}%
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-block px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                                  Approved
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Projections Tab */}
              <TabsContent value="projections">
                <Card className="leonardo-card border-gray-800">
                  <CardHeader>
                    <CardTitle>Financial Projections</CardTitle>
                    <CardDescription className="text-gray-400">
                      Projected financial outcomes for this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Projected Revenue</p>
                        <p className="text-2xl font-bold">${financialData.projections.revenue.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Projected Costs</p>
                        <p className="text-2xl font-bold">${financialData.projections.costs.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400 mb-1">Projected Profit</p>
                        <p className="text-2xl font-bold">${financialData.projections.profit.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                      <div className="flex items-center mb-4">
                        <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                        <h3 className="text-lg font-medium">Key Dates</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Break-even Point:</span>
                          <span className="font-medium">
                            {new Date(financialData.projections.breakEvenDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">ROI Achievement:</span>
                          <span className="font-medium">Q1 2026 (Estimated)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card className="leonardo-card border-gray-800 p-8 text-center">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-2">Select a Project</h3>
              <p className="text-gray-400 mb-6">
                Please select a project from the dropdown above to view its financial data.
              </p>
              <Link href="/projects">
                <Button className="gradient-button">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Browse Projects
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

