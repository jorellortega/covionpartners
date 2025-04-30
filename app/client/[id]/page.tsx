"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, Mail, Instagram, Linkedin, Facebook, Image as ImageIcon } from "lucide-react"

export default function ClientBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  // Mock business data
  const business = {
    id,
    name: "Covion Studio (Mock)",
    tagline: "Digital Solutions for Modern Brands",
    desc: "We help businesses grow with creative web, mobile, and branding solutions.",
    logo: "/mock-logo.png",
    gallery: [
      "/mock-gallery1.jpg",
      "/mock-gallery2.jpg",
      "/mock-gallery3.jpg"
    ],
    socials: [
      { name: "Instagram", url: "https://instagram.com/covionstudio", icon: <Instagram className="w-5 h-5" /> },
      { name: "LinkedIn", url: "https://linkedin.com/company/covionstudio", icon: <Linkedin className="w-5 h-5" /> },
      { name: "Facebook", url: "https://facebook.com/covionstudio", icon: <Facebook className="w-5 h-5" /> },
    ]
  }
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [service, setService] = useState("")
  const [date, setDate] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 py-10">
      <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-lg mb-8 relative bg-gray-900 border border-gray-800">
        {/* Business Info */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-800 bg-gradient-to-r from-purple-700 to-blue-700">
          <img src={business.logo} alt="Logo" className="w-16 h-16 rounded-full border-2 border-white bg-white object-cover" onError={e => (e.currentTarget.src = 'https://placehold.co/64x64?text=Logo')} />
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">Book with {business.name}</h1>
            <p className="text-white/80 font-medium">{business.tagline}</p>
          </div>
        </div>
        <CardContent className="space-y-8 p-6">
          {/* Gallery */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-white">Gallery</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {business.gallery.map((img, i) => (
                <img key={i} src={img} alt="Gallery" className="w-24 h-16 object-cover rounded-lg border border-gray-700 bg-gray-800" onError={e => (e.currentTarget.src = 'https://placehold.co/96x64?text=Image')} />
              ))}
            </div>
          </div>
          {/* Booking Form */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-white">Booking Request</h2>
            {submitted ? (
              <div className="text-green-500 font-semibold mb-4">Booking request sent! We'll contact you soon.</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 mb-4">
                <div>
                  <Label>Your Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <Label>Your Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label>Service Requested</Label>
                  <Input value={service} onChange={e => setService(e.target.value)} placeholder="e.g. Web Design" required />
                </div>
                <div>
                  <Label>Date (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>Message (optional)</Label>
                  <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us more..." />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-lg py-4 rounded-xl font-bold">Send Booking Request</Button>
              </form>
            )}
          </div>
          {/* Social Links */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-white">Connect</h2>
            <div className="flex gap-4">
              {business.socials.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">{s.icon}</a>
              ))}
            </div>
          </div>
          <Link href={`/business/${business.id}`}>
            <Button variant="outline" className="w-full mt-4">Back to Business Profile</Button>
          </Link>
        </CardContent>
      </div>
    </div>
  )
} 