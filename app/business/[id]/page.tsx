"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Phone, Globe, MapPin, Instagram, Linkedin, Facebook, Users, Image as ImageIcon } from "lucide-react"

export default function BusinessProfileViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  // Mock business data
  const business = {
    id,
    name: "Covion Studio (Mock)",
    tagline: "Digital Solutions for Modern Brands",
    desc: "We help businesses grow with creative web, mobile, and branding solutions. Our team delivers high-impact results for startups and enterprises alike.",
    email: "info@covionstudio.com",
    phone: "+1 (555) 123-4567",
    website: "https://covionstudio.com",
    address: "123 Main St, New York, NY 10001",
    logo: "/mock-logo.png", // Replace with your logo path or use a placeholder
    banner: "/mock-banner.jpg", // Replace with your banner path or use a placeholder
    services: [
      { name: "Web Design", icon: <Globe className="w-5 h-5 text-blue-400" /> },
      { name: "Branding", icon: <Users className="w-5 h-5 text-pink-400" /> },
      { name: "Mobile Apps", icon: <ImageIcon className="w-5 h-5 text-green-400" /> },
    ],
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 py-10">
      {/* Hero Section */}
      <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-lg mb-8 relative bg-gray-900 border border-gray-800">
        <div className="h-40 bg-gradient-to-r from-purple-700 to-blue-700 flex items-end justify-between p-6 relative">
          <div className="flex items-end gap-4">
            <img src={business.logo} alt="Logo" className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white object-cover" onError={e => (e.currentTarget.src = 'https://placehold.co/80x80?text=Logo')} />
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">{business.name}</h1>
              <p className="text-lg text-white/80 font-medium">{business.tagline}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* About */}
          <div>
            <h2 className="text-xl font-semibold mb-2 text-white">About</h2>
            <p className="text-gray-300">{business.desc}</p>
          </div>
          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 items-center mt-4">
            <div className="flex items-center gap-2 text-gray-400"><Mail className="w-4 h-4" /><a href={`mailto:${business.email}`} className="underline text-blue-400">{business.email}</a></div>
            <div className="flex items-center gap-2 text-gray-400"><Phone className="w-4 h-4" /><span>{business.phone}</span></div>
            <div className="flex items-center gap-2 text-gray-400"><Globe className="w-4 h-4" /><a href={business.website} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">Website</a></div>
            <div className="flex items-center gap-2 text-gray-400"><MapPin className="w-4 h-4" /><span>{business.address}</span></div>
          </div>
          {/* Services */}
          <div>
            <h2 className="text-xl font-semibold mb-2 text-white mt-6">Services</h2>
            <div className="flex flex-wrap gap-4">
              {business.services.map((service, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-200 shadow">
                  {service.icon}
                  <span>{service.name}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Gallery */}
          <div>
            <h2 className="text-xl font-semibold mb-2 text-white mt-6">Gallery</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {business.gallery.map((img, i) => (
                <img key={i} src={img} alt="Gallery" className="w-32 h-24 object-cover rounded-lg border border-gray-700 bg-gray-800" onError={e => (e.currentTarget.src = 'https://placehold.co/128x96?text=Image')} />
              ))}
            </div>
          </div>
          {/* Social Links */}
          <div>
            <h2 className="text-xl font-semibold mb-2 text-white mt-6">Connect</h2>
            <div className="flex gap-4">
              {business.socials.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">{s.icon}</a>
              ))}
            </div>
          </div>
          {/* Book Now Button */}
          <div className="pt-6">
            <Link href={`/client/${business.id}`}>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-lg py-6 rounded-xl font-bold">Book a Service / Contact</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 