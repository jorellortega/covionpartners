"use client"

import { useRouter, useParams } from "next/navigation"
import { mockJobs } from "@/app/jobs/mockJobs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CompanyJobHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const jobs = mockJobs.filter(job => job.employer?.slug === slug)

  // For demo, let's mock a status for each job
  const getStatus = (job: any) => {
    if (!job.is_active) {
      if (job.filled_by) return "Filled"
      return "Closed"
    }
    return "Open"
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push(`/company/${slug}`)} className="text-gray-400 hover:text-white mr-2">
            Back to Profile
          </Button>
          <h1 className="text-2xl font-bold ml-4">Job History</h1>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-900">
          <table className="min-w-full text-sm text-gray-200">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">Job Title</th>
                <th className="px-4 py-3 text-left">Posted</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">No jobs found for this company.</td>
                </tr>
              )}
              {jobs.map(job => (
                <tr key={job.id} className="border-t border-gray-800">
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${job.id}`} className="text-blue-400 hover:underline">{job.title}</Link>
                  </td>
                  <td className="px-4 py-3">{new Date(job.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatus(job) === "Open" ? "bg-green-900 text-green-300" : getStatus(job) === "Filled" ? "bg-blue-900 text-blue-300" : "bg-gray-800 text-gray-400"}`}>
                      {getStatus(job)}
                    </span>
                    {getStatus(job) === "Filled" && job.filled_by && (
                      job.filled_by.id ? (
                        <Link href={`/profile/${job.filled_by.id}`} className="flex items-center gap-2 mt-1 ml-0.5 hover:underline">
                          <img src={job.filled_by.avatar_url} alt={job.filled_by.name} className="w-6 h-6 rounded-full border border-gray-700" />
                          <span className="text-xs text-blue-200">{job.filled_by.name}</span>
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2 mt-1 ml-0.5">
                          <img src={job.filled_by.avatar_url} alt={job.filled_by.name} className="w-6 h-6 rounded-full border border-gray-700" />
                          <span className="text-xs text-blue-200">{job.filled_by.name}</span>
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getStatus(job) === "Open" && (
                      <Button size="sm" variant="outline" className="text-xs">Mark as Filled</Button>
                    )}
                    {getStatus(job) === "Filled" && (
                      <span className="text-blue-400 text-xs">Filled</span>
                    )}
                    {getStatus(job) === "Closed" && (
                      <span className="text-gray-400 text-xs">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 