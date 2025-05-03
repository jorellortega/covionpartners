'use client'

import { Briefcase, DollarSign, ArrowRight, CheckCircle, Clock, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import React from "react"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }
  return (
    <Badge className={`${getStatusStyles()} border`} variant="outline">
      {status}
    </Badge>
  )
}

// Add type for investment
interface Investment {
  id: number;
  projectName: string;
  projectId: string;
  logoUrl: string | null;
  icon: React.ReactNode;
  description: string;
  amount: number;
  date: string;
  status: string;
  returns: number;
  currentValue: number;
  gainLoss: number;
  gainLossPct: number;
}

export default function PortfolioPage() {
  // Mock investment data
  const investments: Investment[] = [
    {
      id: 1,
      projectName: "AI Startup Platform",
      projectId: "ai-startup",
      logoUrl: null,
      icon: <Briefcase className="w-12 h-12 text-blue-400" />,
      description: "A platform leveraging AI to automate business workflows for startups.",
      amount: 5000,
      date: "2024-03-01",
      status: "Active",
      returns: 0.12, // 12% returns
      currentValue: 5600,
      gainLoss: 600, // positive means gain
      gainLossPct: 0.12 // 12% gain
    },
    {
      id: 2,
      projectName: "Green Energy Fund",
      projectId: "green-energy",
      logoUrl: null,
      icon: <DollarSign className="w-12 h-12 text-green-400" />,
      description: "Investing in renewable energy projects across North America.",
      amount: 2500,
      date: "2023-12-15",
      status: "Completed",
      returns: 0.18, // 18% returns
      currentValue: 2950,
      gainLoss: 450,
      gainLossPct: 0.18
    },
    {
      id: 3,
      projectName: "Healthcare SaaS",
      projectId: "healthcare-saas",
      logoUrl: null,
      icon: <Briefcase className="w-12 h-12 text-purple-400" />,
      description: "A SaaS solution for healthcare providers to manage patient data securely.",
      amount: 10000,
      date: "2024-01-20",
      status: "Active",
      returns: -0.03, // -3% returns
      currentValue: 9700,
      gainLoss: -300,
      gainLossPct: -0.03
    }
  ];

  // Analytics calculations
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalGainLoss = totalCurrent - totalInvested;
  const totalGainLossPct = totalInvested > 0 ? (totalGainLoss / totalInvested) : 0;
  const averageROI = investments.length > 0 ? (investments.reduce((sum, inv) => sum + inv.returns, 0) / investments.length) : 0;
  const bestPerformer = investments.length > 0 ? investments.reduce((best, inv) => inv.returns > best.returns ? inv : best, investments[0]) : null;
  const worstPerformer = investments.length > 0 ? investments.reduce((worst, inv) => inv.returns < worst.returns ? inv : worst, investments[0]) : null;

  // Mock chart data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [15000, 15500, 15800, 16200, 16800, 17000, totalCurrent],
        borderColor: '#facc15',
        backgroundColor: 'rgba(250,204,21,0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  }

  const gradients = [
    'from-purple-500/10 to-blue-500/10 border-purple-500/20 hover:border-purple-500/40',
    'from-green-500/10 to-cyan-500/10 border-green-500/20 hover:border-green-500/40',
    'from-orange-500/10 to-red-500/10 border-orange-500/20 hover:border-orange-500/40'
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      <main className="flex-grow flex flex-col px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-6">
          {/* Analytics Card */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="leonardo-card border-gray-800">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  <h2 className="text-lg font-medium text-white">Portfolio Analytics</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-400">Total Investments</p>
                    <p className="text-2xl font-bold text-white">{investments.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Average ROI</p>
                    <p className="text-2xl font-bold text-green-400">{(averageROI * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Best Performer</p>
                    <p className="text-base font-medium text-green-400">{bestPerformer?.projectName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Worst Performer</p>
                    <p className="text-base font-medium text-red-400">{worstPerformer?.projectName || '-'}</p>
                  </div>
                </div>
                <div className="w-full h-32">
                  <Line data={chartData} options={chartOptions} />
              </div>
              </div>
            </div>
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="leonardo-card border-gray-800">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <Briefcase className="w-5 h-5 mr-2 text-blue-400" />
                    <h2 className="text-lg font-medium text-white">Total Invested</h2>
                  </div>
                  <p className="text-3xl font-bold text-white">${totalInvested.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-1">Last updated: Today</p>
                </div>
              </div>
              <div className="leonardo-card border-gray-800">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    <h2 className="text-lg font-medium text-white">Current Value</h2>
                  </div>
                  <p className="text-3xl font-bold text-white">${totalCurrent.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-1">Portfolio valuation</p>
                </div>
              </div>
              <div className="leonardo-card border-gray-800">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    {totalGainLoss >= 0 ? (
                      <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 mr-2 text-red-400" />
                    )}
                    <h2 className="text-lg font-medium text-white">Total Gain/Loss</h2>
                  </div>
                  <p className={`text-3xl font-bold ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalGainLoss >= 0 ? '+' : ''}{totalGainLoss.toLocaleString()} ({(totalGainLossPct * 100).toFixed(1)}%)
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Overall performance</p>
                </div>
              </div>
            </div>
          </div>
          {/* Investment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investments.map((inv, index) => {
              const gradientClass = gradients[index % gradients.length]
              return (
                <div
                  key={inv.id}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} transition-all duration-300 cursor-pointer leonardo-card border`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    {/* Project Icon/Logo */}
                    <div className="w-full aspect-video relative flex items-center justify-center">
                      {inv.logoUrl ? (
                        <Image src={inv.logoUrl} alt={inv.projectName} fill className="object-cover rounded-t-2xl" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {inv.icon}
                        </div>
                      )}
                    </div>
                    <div className="px-6 pt-4 pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-lg font-bold text-white line-clamp-1">{inv.projectName}</h2>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="text-gray-400 text-sm line-clamp-2 mb-2">{inv.description}</div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="p-2 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center text-gray-400 mb-1">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <span>Invested</span>
                          </div>
                          <div className="text-white font-medium">${inv.amount.toLocaleString()}</div>
                        </div>
                        <div className="p-2 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center text-gray-400 mb-1">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>Date</span>
                          </div>
                          <div className="text-white font-medium">{new Date(inv.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1 text-sm">
                          {inv.gainLoss >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className={inv.gainLoss >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                            {inv.gainLoss >= 0 ? '+' : ''}${inv.gainLoss.toLocaleString()} ({(inv.gainLossPct * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <span className="text-gray-400 text-xs">Current Value: <span className="text-white font-medium">${inv.currentValue.toLocaleString()}</span></span>
                      </div>
                      <div className="space-y-2 mb-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">ROI</span>
                          <span className={inv.returns >= 0 ? 'text-green-400' : 'text-red-400'}>{(inv.returns * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${inv.returns >= 0 ? 'bg-gradient-to-r from-green-400 to-blue-400' : 'bg-gradient-to-r from-red-400 to-yellow-400'}`}
                            style={{ width: `${Math.abs(inv.returns * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Link href={`/projects/${inv.projectId}`}>
                          <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white hover:bg-yellow-900/20 hover:text-yellow-400">
                            View Project
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
} 