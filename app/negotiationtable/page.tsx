"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function NegotiationTablePage() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchNegotiations = async () => {
      const { data, error } = await supabase
        .from("requirement_responses")
        .select(`
          id,
          value,
          submitted_at,
          user_id,
          deal_requirement_id,
          deal_requirements (
            id,
            deal_id,
            custom_label,
            requirement_template_id,
            requirement_templates (
              label
            )
          ),
          users (
            name
          )
        `)
      if (!error && data) {
        setRows(data)
      }
    }
    fetchNegotiations()
  }, [])

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
                  <th className="px-4 py-2">Response</th>
                  <th className="px-4 py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-gray-800">
                    <td className="px-4 py-2 font-medium text-white">{row.users?.name || row.user_id}</td>
                    <td className="px-4 py-2">{row.deal_requirements?.custom_label || row.deal_requirements?.requirement_templates?.label}</td>
                    <td className="px-4 py-2">{row.value}</td>
                    <td className="px-4 py-2">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : ""}</td>
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