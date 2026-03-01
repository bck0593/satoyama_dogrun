"use client";

import { Camera, QrCode } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { apiClient } from "@/src/lib/api";

type CheckinResult = { reservation_id: number; status: string; checked_in_at: string } | null;

export default function CheckinPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerTimerRef = useRef<number | null>(null);

  const [manualToken, setManualToken] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = () => {
    if (scannerTimerRef.current) {
      window.clearInterval(scannerTimerRef.current);
      scannerTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  useEffect(() => stopCamera, []);

  const submitQrToken = async (token: string) => {
    try {
      const response = await apiClient.checkinByQr(token);
      setResult(response);
      setError(null);
      return true;
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "チェックインに失敗しました。");
      return false;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);

      const AnyBarcodeDetector = (window as Window & { BarcodeDetector?: any }).BarcodeDetector;
      if (!AnyBarcodeDetector) {
        setCameraError("このブラウザはカメラQR読み取りに未対応です。下の手入力をご利用ください。");
        return;
      }

      const detector = new AnyBarcodeDetector({ formats: ["qr_code"] });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      scannerTimerRef.current = window.setInterval(async () => {
        const video = videoRef.current;
        if (!video || !ctx || video.readyState < 2) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const barcodes = await detector.detect(canvas);
          if (!barcodes?.length) return;
          const value = barcodes[0]?.rawValue;
          if (!value) return;

          const ok = await submitQrToken(value);
          if (ok) {
            stopCamera();
          }
        } catch {
          // ignore scan loop errors
        }
      }, 700);
    } catch {
      setCameraError("カメラを起動できませんでした。権限設定を確認してください。");
    }
  };

  const submitManual = async (event: FormEvent) => {
    event.preventDefault();
    if (!manualToken.trim()) return;
    await submitQrToken(manualToken.trim());
  };

  return (
    <AuthGuard>
      <MobilePage>
        <PageHeader title="QRチェックイン" description="カメラ起動または手入力でQRを読み取り" />

        <div className="space-y-4 px-4 py-5">
          <section className="section-card">
            <button
              type="button"
              onClick={startCamera}
              className="mb-3 inline-flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
            >
              <Camera className="mr-2 h-4 w-4" />
              カメラ起動
            </button>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-black">
              <video ref={videoRef} className="h-56 w-full object-cover" muted playsInline />
            </div>

            <p className="mt-2 text-sm text-gray-600">{cameraReady ? "読み取り中..." : "カメラ未起動"}</p>
            {cameraError ? <p className="mt-2 text-sm text-amber-700">{cameraError}</p> : null}
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-bold text-gray-900">
              <QrCode className="mr-2 h-4 w-4 text-orange-500" />
              QRトークン手入力
            </h2>
            <form className="space-y-2" onSubmit={submitManual}>
              <input
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
                placeholder="UUIDを入力"
              />
              <button type="submit" className="w-full rounded-xl border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-600">
                手入力でチェックイン
              </button>
            </form>
          </section>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {result ? (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">チェックイン成功</p>
              <p className="mt-1">予約ID: {result.reservation_id}</p>
              <p>状態: {result.status}</p>
              <p>時刻: {result.checked_in_at}</p>
            </section>
          ) : null}
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
