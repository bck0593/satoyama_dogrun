"use client"

import { useEffect, useRef } from "react"

type QRCodeDisplayProps = {
  value: string
  size?: number
}

export default function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateQR = async () => {
      try {
        const QRCode = (await import("qrcode")).default

        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          })
        }
      } catch (error) {
        console.error("Failed to generate QR code:", error)
      }
    }

    generateQR()
  }, [value, size])

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} className="border border-gray-200 rounded-lg" />
    </div>
  )
}
