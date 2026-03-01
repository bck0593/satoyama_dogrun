"use client"

import { useState, useEffect } from "react"
import { Heart, Calendar, MapPin } from "lucide-react"
import HomeBar from "../../components/home-bar"
import BottomTabBar from "../../components/bottom-tab-bar"
import { Button } from "@/components/ui/button"

type FavoriteEvent = {
  id: string
  title: string
  date: string
  location: string
  image: string
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("favorite_events")
    if (stored) {
      setFavorites(JSON.parse(stored))
    }
  }, [])

  const removeFavorite = (eventId: string) => {
    const updated = favorites.filter((event) => event.id !== eventId)
    setFavorites(updated)
    localStorage.setItem("favorite_events", JSON.stringify(updated))
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <HomeBar title="お気に入りイベント" />

      <div className="px-4 py-6">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">お気に入りがありません</h3>
            <p className="text-gray-500 text-sm">
              気になるイベントをお気に入りに追加すると
              <br />
              こちらに表示されます。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="aspect-video bg-gray-200 relative">
                  <img
                    src={event.image || "/images/FC今治コミュニティ.jpg"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2">{event.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => removeFavorite(event.id)} className="w-full">
                    お気に入りから削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomTabBar />
    </div>
  )
}
