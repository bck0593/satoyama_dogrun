"use client";

import Link from "next/link";
import { Camera, CheckCircle2, QrCode, TriangleAlert } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { StatusPill } from "@/src/components/status-pill";
import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { apiClient } from "@/src/lib/api";

type CheckinResult = { reservation_id: number; status: string; checked_in_at: string } | null;

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CheckinPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerTimerRef = useRef<number | null>(null);

  const [manualToken, setManualToken] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckinResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      const response = await apiClient.checkinByQr(token);
      setResult(response);
      setError(null);
      return true;
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "チェックインに失敗しました。");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setError(null);
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
          // Ignore scan loop errors and keep scanning.
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
        <PageHeader title="チェックイン" description="当日の入場はここから。QRを読み取るだけで完了します" />

        <div className="space-y-4 px-4 py-5">
          <section className="brand-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="brand">当日利用はこちら</StatusPill>
              <StatusPill tone={cameraReady ? "success" : "neutral"}>
                {cameraReady ? "カメラ起動中" : "カメラ未起動"}
              </StatusPill>
            </div>
            <h2 className="mt-3 text-xl font-black text-[#153a71]">現地では、まずQRを読み取ってください。</h2>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-[#567196]">
              <li>1. カメラを起動して、予約QRを画面にかざします。</li>
              <li>2. 読み取りが難しい場合は、下の入力欄にトークンを貼り付けます。</li>
              <li>3. 成功すると、その場でチェックイン完了が表示されます。</li>
            </ol>
          </section>

          <section className="section-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center text-base font-black text-gray-900">
                <Camera className="mr-2 h-4 w-4 text-[#0a438d]" />
                カメラで読み取る
              </h2>
              <StatusPill tone={cameraReady ? "success" : "neutral"}>
                {cameraReady ? "読み取り中" : "待機中"}
              </StatusPill>
            </div>

            <button
              type="button"
              onClick={startCamera}
              disabled={submitting}
              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              <Camera className="mr-2 h-4 w-4" />
              {cameraReady ? "カメラを再起動" : "カメラを起動"}
            </button>

            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-black">
              <video ref={videoRef} className="h-60 w-full object-cover" muted playsInline />
            </div>

            <p className="mt-2 text-sm text-gray-600">
              {cameraReady ? "QRをかざすと自動で読み取ります。" : "まだカメラを起動していません。"}
            </p>
            {cameraError ? <p className="mt-2 text-sm text-amber-700">{cameraError}</p> : null}
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-black text-gray-900">
              <QrCode className="mr-2 h-4 w-4 text-[#0a438d]" />
              読み取りできないとき
            </h2>
            <p className="text-sm text-gray-600">予約画面やスタッフ案内のトークンを、そのまま貼り付けてください。</p>
            <form className="mt-3 space-y-2" onSubmit={submitManual}>
              <input
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-3 py-3"
                placeholder="UUIDを入力"
              />
              <button
                type="submit"
                disabled={submitting || !manualToken.trim()}
                className="w-full rounded-2xl border border-[#b9cde8] bg-white px-4 py-3 text-sm font-bold text-[#0b438f] disabled:opacity-50"
              >
                手入力でチェックイン
              </button>
            </form>
          </section>

          {error ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <div className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">チェックインできませんでした。</p>
                  <p className="mt-1">{error}</p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href="/mypage"
                      className="inline-flex rounded-xl bg-white px-3 py-2 font-bold text-red-700"
                    >
                      予約を確認する
                    </Link>
                    <Link
                      href="/reservation"
                      className="inline-flex rounded-xl border border-red-200 px-3 py-2 font-bold text-red-700"
                    >
                      予約画面へ
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {result ? (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">チェックインが完了しました。</p>
                  <p className="mt-1">予約ID: {result.reservation_id}</p>
                  <p>状態: {result.status}</p>
                  <p>時刻: {formatDateTime(result.checked_in_at)}</p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href="/live-status"
                      className="inline-flex rounded-xl bg-emerald-600 px-3 py-2 font-bold text-white"
                    >
                      利用状況を見る
                    </Link>
                    <Link
                      href="/mypage"
                      className="inline-flex rounded-xl border border-emerald-200 px-3 py-2 font-bold text-emerald-700"
                    >
                      マイページへ
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
