"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const mockNegotiation = [
  {
    party: "Alice",
    requirement: "Needs 100 widgets by June",
    offer: "Can pay 10% premium for rush delivery",
    status: "pending"
  },
  {
    party: "Bob",
    requirement: "Wants payment upfront",
    offer: "Can deliver by June 10th",
    status: "pending"
  },
  {
    party: "Charlie",
    requirement: "Needs NDA signed",
    offer: "Will provide design documents early",
    status: "accepted"
  }
]

export default function NegotiationTablePage() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState(mockNegotiation)

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4 flex flex-col items-center">
      <Card className="w-full max-w-3xl mb-8">
        <CardHeader>
          <CardTitle>Negotiation Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-400">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="px-4 py-2">Party</th>
                  <th className="px-4 py-2">Requirement</th>
                  <th className="px-4 py-2">Offer</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-800">
                    <td className="px-4 py-2 font-medium text-white">{row.party}</td>
                    <td className="px-4 py-2">{row.requirement}</td>
                    <td className="px-4 py-2">{row.offer}</td>
                    <td className="px-4 py-2 capitalize">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'accepted' ? 'bg-green-500/20 text-green-400' : row.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-6">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Add Requirement/Offer</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Requirement/Offer</DialogTitle>
                </DialogHeader>
                {/* Mock form, does not save */}
                <div className="space-y-4">
                  <Input placeholder="Party Name" disabled />
                  <Input placeholder="Requirement" disabled />
                  <Input placeholder="Offer" disabled />
                </div>
                <Button className="w-full mt-4" disabled>Save (Mock Only)</Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 