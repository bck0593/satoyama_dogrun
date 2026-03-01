"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Clock, Users, Dog, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import BottomTabBar from "../../components/bottom-tab-bar"
import type { DogrunSlot } from "@/src/types"

type BookingForm = {
  date: string
  time: string
  people: number
  dogs: number
  name: string
  email: string
  phone: string
  dogs_detail: { name: string; breed: string }[]
  health: {
    rabies: boolean
    mixed_vaccine: boolean
    in_heat: boolean
  }
  agree: boolean
}

export default function DogrunBookPage() {
  const router = useRouter()
  const [slots, setSlots] = useState<DogrunSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<BookingForm>({
    date: "",
    time: "",
    people: 1,
    dogs: 1,
    name: "",
    email: "",
    phone: "",
    dogs_detail: [{ name: "", breed: "" }],
    health: {
      rabies: false,
      mixed_vaccine: false,
      in_heat: false,
    },
    agree: false,
  })

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      const today = new Date()
      const dates = []
      for (let i = 0; i < 28; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date.toISOString().split("T")[0])
      }

      const allSlots: DogrunSlot[] = []
      for (const date of dates) {
        const response = await fetch(`/api/dogrun/availability?date=${date}`)
        if (response.ok) {
          const data = await response.json()
          allSlots.push(...data.slots)
        }
      }
      setSlots(allSlots)
    } catch (error) {
      console.error("Failed to fetch availability:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/dogrun/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (response.ok) {
        const { id } = await response.json()
        router.push(`/dogrun/booking/${id}/done`)
      } else {
        const { error } = await response.json()
        alert(error || "予約に失敗しました")
      }
    } catch (error) {
      alert("ネットワークエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  const updateDogDetail = (index: number, field: "name" | "breed", value: string) => {
    const newDetails = [...form.dogs_detail]
    newDetails[index] = { ...newDetails[index], [field]: value }
    setForm({ ...form, dogs_detail: newDetails })
  }

  const addDog = () => {
    setForm({
      ...form,
      dogs: form.dogs + 1,
      dogs_detail: [...form.dogs_detail, { name: "", breed: "" }],
    })
  }

  const removeDog = () => {
    if (form.dogs > 1) {
      setForm({
        ...form,
        dogs: form.dogs - 1,
        dogs_detail: form.dogs_detail.slice(0, -1),
      })
    }
  }

  const getAvailableSlots = () => {
    if (!form.date) return []
    return slots.filter((slot) => slot.date === form.date && slot.capacity - slot.reserved >= form.people + form.dogs)
  }

  const getUniqueDates = () => {
    const dates = [...new Set(slots.map((slot) => slot.date))]
    return dates.sort()
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">ドッグラン予約</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Date Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            日程選択
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {getUniqueDates()
              .slice(0, 14)
              .map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setForm({ ...form, date, time: "" })}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    form.date === date
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {new Date(date).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  })}
                </button>
              ))}
          </div>
        </div>

        {/* Time Selection */}
        {form.date && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              時間選択
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {getAvailableSlots().map((slot) => (
                <button
                  key={`${slot.date}-${slot.time}`}
                  type="button"
                  onClick={() => setForm({ ...form, time: slot.time })}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    form.time === slot.time
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div>{slot.time}</div>
                  <div className="text-xs opacity-75">残り{slot.capacity - slot.reserved}枠</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Participant Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            参加者情報
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">人数</label>
                <Input
                  type="number"
                  min="1"
                  value={form.people}
                  onChange={(e) => setForm({ ...form, people: Number.parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">犬の頭数</label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="1" value={form.dogs} readOnly className="flex-1" />
                  <Button type="button" size="sm" onClick={addDog}>
                    +
                  </Button>
                  <Button type="button" size="sm" onClick={removeDog} disabled={form.dogs <= 1}>
                    -
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">お名前 *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Dog Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Dog className="w-5 h-5" />
            犬の詳細
          </h2>
          <div className="space-y-4">
            {form.dogs_detail.map((dog, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">{index + 1}頭目</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                    <Input value={dog.name} onChange={(e) => updateDogDetail(index, "name", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">犬種</label>
                    <Input value={dog.breed} onChange={(e) => updateDogDetail(index, "breed", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Check */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            健康チェック
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rabies"
                checked={form.health.rabies}
                onCheckedChange={(checked) => setForm({ ...form, health: { ...form.health, rabies: !!checked } })}
              />
              <label htmlFor="rabies" className="text-sm font-medium text-gray-700">
                狂犬病予防接種済み *
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mixed_vaccine"
                checked={form.health.mixed_vaccine}
                onCheckedChange={(checked) =>
                  setForm({ ...form, health: { ...form.health, mixed_vaccine: !!checked } })
                }
              />
              <label htmlFor="mixed_vaccine" className="text-sm font-medium text-gray-700">
                混合ワクチン接種済み *
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in_heat"
                checked={form.health.in_heat}
                onCheckedChange={(checked) => setForm({ ...form, health: { ...form.health, in_heat: !!checked } })}
              />
              <label htmlFor="in_heat" className="text-sm font-medium text-gray-700">
                発情中である
              </label>
            </div>
          </div>
        </div>

        {/* Agreement */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agree"
              checked={form.agree}
              onCheckedChange={(checked) => setForm({ ...form, agree: !!checked })}
            />
            <label htmlFor="agree" className="text-sm text-gray-700 leading-relaxed">
              利用規約に同意し、犬の健康状態に問題がないことを確認します。また、施設内での事故については自己責任であることを理解しています。*
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={
            isLoading ||
            !form.date ||
            !form.time ||
            !form.name ||
            !form.email ||
            !form.health.rabies ||
            !form.health.mixed_vaccine ||
            form.health.in_heat ||
            !form.agree
          }
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {isLoading ? "予約中..." : "予約を確定する"}
        </Button>
      </form>

      <BottomTabBar />
    </div>
  )
}
