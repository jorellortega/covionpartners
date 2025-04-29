"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Send, Users, Plus, Bell } from 'lucide-react'

// Mock data for teams and messages
const mockTeams = [
  {
    id: '1',
    name: 'Development Team',
    members: 8,
    lastMessage: 'Let\'s discuss the sprint planning',
    lastMessageTime: '2h ago',
    avatar: '/avatars/team1.png'
  },
  {
    id: '2',
    name: 'Marketing Team',
    members: 5,
    lastMessage: 'New campaign launch next week',
    lastMessageTime: '1d ago',
    avatar: '/avatars/team2.png'
  },
  {
    id: '3',
    name: 'Design Team',
    members: 4,
    lastMessage: 'UI/UX review scheduled',
    lastMessageTime: '3h ago',
    avatar: '/avatars/team3.png'
  }
]

const mockMessages = [
  {
    id: '1',
    sender: 'John Doe',
    message: 'Good morning team! How\'s everyone doing?',
    time: '09:30 AM',
    avatar: '/avatars/user1.png'
  },
  {
    id: '2',
    sender: 'Jane Smith',
    message: 'Morning! Working on the new feature implementation.',
    time: '09:32 AM',
    avatar: '/avatars/user2.png'
  },
  {
    id: '3',
    sender: 'Mike Johnson',
    message: 'Just finished the backend integration. Ready for testing.',
    time: '09:35 AM',
    avatar: '/avatars/user3.png'
  }
]

export default function GroupChatPage() {
  const router = useRouter()
  const [selectedTeam, setSelectedTeam] = useState(mockTeams[0])
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message to the server
      console.log('Sending message:', newMessage)
      setNewMessage('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
              <span className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full p-1.5 mr-3">
                <MessageSquare className="w-6 h-6 text-white" />
              </span>
              Group Chat
            </h1>
            <Button 
              variant="outline" 
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-cyan-900/20 hover:text-cyan-400"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Teams List */}
          <Card className="leonardo-card border-gray-800 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Teams</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-cyan-900/20 hover:text-cyan-400"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockTeams.map((team) => (
                <div
                  key={team.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTeam.id === team.id
                      ? 'bg-cyan-900/20 text-cyan-400'
                      : 'hover:bg-gray-800/50'
                  }`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={team.avatar} />
                      <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                        <Users className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{team.name}</p>
                      <p className="text-sm text-gray-400">
                        {team.members} members • {team.lastMessageTime}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="leonardo-card border-gray-800 lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedTeam.avatar} />
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                    <Users className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedTeam.name}</CardTitle>
                  <p className="text-sm text-gray-400">{selectedTeam.members} members</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 h-[500px] overflow-y-auto pr-4">
                {mockMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={msg.avatar} />
                      <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                        {msg.sender.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{msg.sender}</p>
                        <span className="text-xs text-gray-400">{msg.time}</span>
                      </div>
                      <p className="text-gray-300">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-gray-800/50 border-gray-700 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={handleSendMessage}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 