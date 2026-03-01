"use client"

import { useState } from "react"
import { X, Calendar, MapPin, Tag, Grid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"

// Available filter options
const availableTags = [
  { id: "t1", name: "音楽", slug: "music" },
  { id: "t2", name: "野外", slug: "outdoor" },
  { id: "t3", name: "ファミリー", slug: "family" },
  { id: "t4", name: "ペット", slug: "pet" },
  { id: "t5", name: "里山", slug: "satoyama" },
  { id: "t6", name: "サッカー", slug: "soccer" },
  { id: "t7", name: "キッズ", slug: "kids" },
  { id: "t8", name: "体験", slug: "trial" },
  { id: "t9", name: "レポート", slug: "report" },
  { id: "t10", name: "コミュニティ", slug: "community" },
  { id: "t11", name: "清掃", slug: "cleanup" },
]

const availableCategories = [
  { id: "c1", name: "フェスティバル", slug: "festival" },
  { id: "c2", name: "アウトドア", slug: "outdoor" },
  { id: "c3", name: "スポーツ", slug: "sports" },
]

const availableVenues = ["今治市民の森", "今治里山公園", "FC今治トレーニングセンター", "今治城周辺公園", "今治港海岸線"]

interface FilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: {
    tags: string[]
    category: string
    venue: string
    startDate: string
    endDate: string
  }
  onFiltersChange: (filters: {
    tags: string[]
    category: string
    venue: string
    startDate: string
    endDate: string
  }) => void
}

export default function FilterSheet({ open, onOpenChange, filters, onFiltersChange }: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleApply = () => {
    onFiltersChange(localFilters)
    onOpenChange(false)
  }

  const handleClear = () => {
    const clearedFilters = {
      tags: [],
      category: "",
      venue: "",
      startDate: "",
      endDate: "",
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onOpenChange(false)
  }

  const toggleTag = (tagSlug: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagSlug) ? prev.tags.filter((t) => t !== tagSlug) : [...prev.tags, tagSlug],
    }))
  }

  const hasActiveFilters =
    localFilters.tags.length > 0 ||
    localFilters.category ||
    localFilters.venue ||
    localFilters.startDate ||
    localFilters.endDate

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold">フィルター</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-semibold">タグ</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.slug)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    localFilters.tags.includes(tag.slug)
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Grid className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-semibold">カテゴリ</Label>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setLocalFilters((prev) => ({ ...prev, category: "" }))}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                  !localFilters.category
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                すべて
              </button>
              {availableCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      category: prev.category === category.slug ? "" : category.slug,
                    }))
                  }
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                    localFilters.category === category.slug
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Venue */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-semibold">会場</Label>
            </div>
            <Input
              type="text"
              placeholder="会場名で検索..."
              value={localFilters.venue}
              onChange={(e) => setLocalFilters((prev) => ({ ...prev, venue: e.target.value }))}
              className="mb-2"
            />
            <div className="space-y-1">
              {availableVenues.map((venue) => (
                <button
                  key={venue}
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      venue: prev.venue === venue ? "" : venue,
                    }))
                  }
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                    localFilters.venue === venue
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {venue}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Label className="text-sm font-semibold">開催日</Label>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="start-date" className="text-xs text-gray-500 mb-1 block">
                  開始日
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={localFilters.startDate}
                  onChange={(e) => setLocalFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-xs text-gray-500 mb-1 block">
                  終了日
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={localFilters.endDate}
                  onChange={(e) => setLocalFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          <Button onClick={handleApply} className="w-full">
            フィルターを適用
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClear} className="w-full bg-transparent">
              すべてクリア
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
