"use client"
import Head from "next/head"
import { DollarSign, BarChart2, Shield, TrendingUp, Send, UserCheck, Star } from "lucide-react"

export default function FinancialHubPage() {
  return (
    <>
      <Head>
        <title>Financial Hub | Payments, Balances, and Real-Time Insights</title>
        <meta name="description" content="Easily manage your payments, balances, and financial activity in one place. Access real-time insights, secure transactions, and advanced financial analytics." />
      </Head>
      <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full mx-auto text-center py-20">
          <div className="flex flex-col items-center mb-8">
            <span className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-4 mb-4">
              <DollarSign className="w-12 h-12 text-white" />
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Financial Hub</h1>
            <p className="text-lg text-gray-300 mb-6">
              Easily manage your payments, send money to other users, track balances, and monitor financial activity in one place with powerful tools and real-time insights.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <BarChart2 className="w-8 h-8 text-blue-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Real-Time Insights</h3>
              <p className="text-gray-400">Monitor your financial activity and balances with up-to-date analytics and reporting.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <Shield className="w-8 h-8 text-green-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Secure Transactions</h3>
              <p className="text-gray-400">All payments and financial data are protected with robust security and privacy features.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <TrendingUp className="w-8 h-8 text-purple-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Financial Analytics</h3>
              <p className="text-gray-400">Gain deeper insights into your spending, revenue, and growth with advanced analytics tools.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <DollarSign className="w-8 h-8 text-yellow-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Comprehensive Management</h3>
              <p className="text-gray-400">Track payments, manage balances, and oversee all your financial activity in one dashboard.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <Send className="w-8 h-8 text-cyan-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Send Money to Other Users</h3>
              <p className="text-gray-400">Easily transfer funds to other users securely and instantly within the platform.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <UserCheck className="w-8 h-8 text-indigo-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Pay People for Projects</h3>
              <p className="text-gray-400">Pay collaborators, freelancers, or team members directly for their work on projects.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <Star className="w-8 h-8 text-pink-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Support Token Feature</h3>
              <p className="text-gray-400">Support projects or users with tokens and unlock special features or rewards.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 