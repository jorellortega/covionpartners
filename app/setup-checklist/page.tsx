"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Circle, 
  User, 
  Building2, 
  CreditCard, 
  ArrowRight,
  Star,
  Info
} from 'lucide-react'

export default function SetupChecklistPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const setupSteps = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Set up your user profile with all necessary details and information',
      icon: User,
      route: `/profile/${user?.id}`,
      priority: 1,
      benefits: [
        'Personalize your experience',
        'Build trust with other users',
        'Enable proper communication'
      ]
    },
    {
      id: 'organization',
      title: 'Create Your Organization',
      description: 'Set up your business or organization profile to start collaborating',
      icon: Building2,
      route: '/createorganization',
      priority: 2,
      benefits: [
        'Manage team members',
        'Create and manage projects',
        'Access organization features'
      ]
    },
    {
      id: 'payments',
      title: 'Activate Covion Bank',
      description: 'Sign up with Stripe to activate your Covion Bank account for payments',
      icon: CreditCard,
      route: '/managepayments',
      priority: 3,
      benefits: [
        'Send and receive payments',
        'Access financial tools',
        'Complete transactions securely'
      ]
    }
  ]

  const handleStepClick = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId])
    }
  }

  const handleRouteClick = (route: string) => {
    router.push(route)
  }

  const getStepStatus = (stepId: string) => {
    return completedSteps.includes(stepId) ? 'completed' : 'pending'
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'text-red-400 bg-red-900/20 border-red-500/30'
      case 2:
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
      case 3:
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30'
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30'
    }
  }

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1:
        return 'Critical'
      case 2:
        return 'Important'
      case 3:
        return 'Recommended'
      default:
        return 'Optional'
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Setup Checklist
              </h1>
              <p className="text-gray-400 text-sm sm:text-lg">
                Complete these steps to unlock the full potential of Covion Partners
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Progress Overview */}
        <div className="leonardo-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Your Progress</h2>
            <Badge variant="outline" className="border-purple-500 text-purple-400">
              {completedSteps.length} of {setupSteps.length} completed
            </Badge>
          </div>
          
          <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps.length / setupSteps.length) * 100}%` }}
            />
          </div>
          
          <p className="text-gray-400 text-sm">
            {completedSteps.length === setupSteps.length 
              ? "🎉 Congratulations! You've completed all setup steps and unlocked the full platform experience."
              : `Complete ${setupSteps.length - completedSteps.length} more step${setupSteps.length - completedSteps.length !== 1 ? 's' : ''} to unlock all features.`
            }
          </p>
        </div>

        {/* Setup Steps */}
        <div className="space-y-4">
          {setupSteps.map((step) => {
            const isCompleted = getStepStatus(step.id) === 'completed'
            const Icon = step.icon
            
            return (
              <Card 
                key={step.id}
                className={`leonardo-card border-gray-800 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                  isCompleted ? 'bg-green-900/20 border-green-700/50' : 'bg-gray-800/30'
                }`}
                onClick={() => handleStepClick(step.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-700/50 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className={`text-lg ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                            {step.title}
                          </CardTitle>
                          <Badge className={getPriorityColor(step.priority)}>
                            {getPriorityText(step.priority)}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">{step.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Benefits */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      Why this matters:
                    </h4>
                    <ul className="space-y-1">
                      {step.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm text-gray-400 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRouteClick(step.route)
                      }}
                      className={`${
                        isCompleted 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'gradient-button hover:bg-purple-700'
                      }`}
                    >
                      {isCompleted ? 'View' : 'Complete Step'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    {isCompleted && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Completed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Additional Tips */}
        <div className="leonardo-card p-6 mt-8">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Pro Tips</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Complete these steps in order for the best experience</li>
                <li>• Your profile is the foundation - start there!</li>
                <li>• Organization setup enables team collaboration features</li>
                <li>• Covion Bank activation unlocks all financial tools</li>
                <li>• You can always return to this checklist from your dashboard</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="leonardo-card p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/profile/${user?.id}`)}
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
            >
              Complete Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/createorganization')}
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
            >
              Create Organization
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/managepayments')}
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
            >
              Activate Covion Bank
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
