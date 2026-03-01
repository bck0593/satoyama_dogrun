"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

import type { Event } from "@/src/types"
import { useAuth } from "../contexts/auth-context"
import ApplyDialog from "./apply-dialog"

interface ApplyButtonProps {
  event: Event
}

export default function ApplyButton({ event }: ApplyButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const { user } = useAuth()

  const handleApply = () => {
    if (!user) {
      alert("申し込みにはログインが必要です。事前に会員登録をお願いいたします。")
      return
    }
    setShowDialog(true)
  }

  return (
    <>
      <Button onClick={handleApply} className="w-full bg-brand-primary hover:bg-blue-700 text-white font-medium py-3">
        申込みフォームを開く
      </Button>

      <ApplyDialog event={event} open={showDialog} onOpenChange={setShowDialog} />
    </>
  )
}
