'use client';

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, ClipboardList, Calendar } from "lucide-react";

const mockProject = {
  name: "Website Redesign for Acme Corp",
  description: "Redesign the corporate website to improve UX and update branding.",
  deadline: "2024-08-15",
  status: "Active",
  requirements: [
    "Complete homepage wireframe",
    "Implement responsive navigation",
    "Integrate CMS for blog section",
    "QA testing on all major browsers",
  ],
  team: [
    { name: "Jane Doe", role: "Project Manager" },
    { name: "John Smith", role: "Frontend Developer" },
    { name: "Alex Lee", role: "UI/UX Designer" },
  ],
  updates: [
    { date: "2024-06-10", content: "Initial kickoff meeting completed." },
    { date: "2024-06-15", content: "Wireframes for homepage delivered." },
    { date: "2024-06-20", content: "Navigation component implemented." },
  ],
};

const mockPayment = {
  amount: 2500,
  currency: "USD",
  status: "Pending", // Could be 'Pending', 'Paid', 'Overdue', etc.
  dueDate: "2024-08-20",
};

export default function WorkDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="leonardo-header sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-2 py-4 px-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-blue-400" /> Work Dashboard
          </h1>
          <p className="text-gray-400 text-base">Welcome to your project portal. Here you can track your work, requirements, and updates.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Project Overview Card */}
        <Card className="leonardo-card border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-lg text-white">{mockProject.name}</CardTitle>
            </div>
            <StatusBadge status={mockProject.status} />
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-2">{mockProject.description}</p>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Deadline:</span>
              <span className="font-semibold text-white">{mockProject.deadline}</span>
            </div>
          </CardContent>
        </Card>

        {/* Requirements Card */}
        <Card className="leonardo-card border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-lg text-white">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-1">
              {mockProject.requirements.map((req, idx) => (
                <li key={idx} className="text-gray-300">{req}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Team Members Card */}
        <Card className="leonardo-card border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            <CardTitle className="text-lg text-white">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-800">
              {mockProject.team.map((member, idx) => (
                <li key={idx} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-gray-200">{member.name}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">{member.role}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Updates Card */}
        <Card className="leonardo-card border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-400" />
            <CardTitle className="text-lg text-white">Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mockProject.updates.map((update, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20">{update.date}</span>
                  <span className="text-gray-200">{update.content}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Payment Card */}
        <Card className="leonardo-card border-gray-800">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Briefcase className="w-5 h-5 text-pink-400" />
            <CardTitle className="text-lg text-white">Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-gray-400 text-sm">Agreed Amount</div>
                <div className="text-2xl font-bold text-white">
                  {mockPayment.currency} ${mockPayment.amount.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-start sm:items-end">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Status:</span>
                  <Badge variant={mockPayment.status === 'Paid' ? 'secondary' : 'destructive'} className="text-xs">
                    {mockPayment.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Calendar className="w-4 h-4 text-yellow-400" />
                  <span>Due: <span className="text-white font-medium">{mockPayment.dueDate}</span></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 