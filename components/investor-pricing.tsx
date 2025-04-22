import { Button } from '@/components/ui/button'
import { DollarSign, Check } from 'lucide-react'

export function InvestorPricing() {
  return (
    <div className="rounded-lg border border-gray-800 bg-[#13131a] p-8">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-purple-500/10 p-3">
          <DollarSign className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Investor Account</h2>
          <p className="text-gray-400">For active investors and project supporters</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-white">Free</span>
          <span className="ml-1 text-sm text-gray-400">to join</span>
        </div>
        <p className="mt-2 text-sm text-purple-400">
          Revenue Share Model: 2% of successful investments
        </p>
      </div>

      <ul className="mt-8 space-y-4">
        <li className="flex items-start">
          <Check className="mr-3 h-5 w-5 text-green-500 shrink-0" />
          <span className="text-gray-300">View Public Projects</span>
        </li>
        <li className="flex items-start">
          <Check className="mr-3 h-5 w-5 text-green-500 shrink-0" />
          <span className="text-gray-300">Support Projects</span>
        </li>
        <li className="flex items-start">
          <Check className="mr-3 h-5 w-5 text-green-500 shrink-0" />
          <span className="text-gray-300">Project Discovery</span>
        </li>
        <li className="flex items-start">
          <Check className="mr-3 h-5 w-5 text-green-500 shrink-0" />
          <span className="text-gray-300">Basic Analytics</span>
        </li>
        <li className="flex items-start">
          <Check className="mr-3 h-5 w-5 text-green-500 shrink-0" />
          <span className="text-gray-300">Project Funding</span>
        </li>
        <li className="flex items-start">
          <Check className="mr-3 h-5 w-5 text-green-500 shrink-0" />
          <span className="text-gray-300">Team Collaboration</span>
        </li>
        <li className="flex items-start">
          <Check className="mr-3 h-5 w-5 text-green-500 shrink-0" />
          <span className="text-gray-300">Advanced Analytics</span>
        </li>
      </ul>

      <div className="mt-8">
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          Sign Up Now
        </Button>
        <p className="mt-3 text-xs text-center text-gray-500">
          2% fee only applies to successful investments. No upfront costs.
        </p>
      </div>
    </div>
  )
} 