"use client"

import { useState } from "react"
import { ArrowLeft, RotateCcw } from "lucide-react"
import Link from "next/link"

export default function MembershipPage() {
  const [asisatoPoints, setAsisatoPoints] = useState(0)
  const [participationStatus, setParticipationStatus] = useState("共育ON")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">アシさと会員証</h1>
      </div>

      <div className="px-4 py-6">
        {/* Membership Card */}
        <div className="relative mb-6">
          <img src="/images/membership-card.png" alt="アシさと会員証" className="w-full rounded-2xl shadow-lg" />
        </div>

        {/* Points Display */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">アシさとポイント</h2>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{asisatoPoints}</div>
            <div className="text-sm text-gray-500">ポイント</div>
          </div>
        </div>

        {/* Participation Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">参加証</h3>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="text-gray-700">参加証</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                participationStatus === "共育ON" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
              }`}
            >
              {participationStatus}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <Link
            href="/events?provider=asisato"
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            アシさとクラブのイベントを見る
          </Link>

          <Link
            href="/asisato/history"
            className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            参加履歴を見る
          </Link>
        </div>
      </div>
    </div>
  )
}
