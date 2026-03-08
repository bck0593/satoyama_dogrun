"use client";

import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ReservationCancelDialogProps = {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  description: string;
  submitLabel: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonRequired?: boolean;
  helperText?: string;
  disabled?: boolean;
  onSubmit: (reason: string) => Promise<void>;
};

export function ReservationCancelDialog({
  triggerLabel,
  triggerClassName,
  title,
  description,
  submitLabel,
  reasonLabel = "キャンセル理由",
  reasonPlaceholder = "必要があれば入力してください",
  reasonRequired = false,
  helperText,
  disabled = false,
  onSubmit,
}: ReservationCancelDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    if (reasonRequired && !trimmedReason) {
      setError("理由を入力してください。");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmedReason);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "予約キャンセルに失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      <AlertDialog open={open} onOpenChange={(nextOpen) => !submitting && setOpen(nextOpen)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              {reasonLabel}
              {reasonRequired ? <span className="ml-1 text-red-600">*</span> : null}
            </label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={reasonPlaceholder}
              disabled={submitting}
            />
            {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>戻る</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "処理中..." : submitLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
