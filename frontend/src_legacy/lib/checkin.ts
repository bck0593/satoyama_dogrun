import jwt from "jsonwebtoken"

const CHECKIN_SECRET = process.env.CHECKIN_SECRET || "dogrun-checkin-secret-key"

export type CheckinTokenPayload = {
  kind: "dogrun"
  bookingId: string
  date: string
  time: string
  email: string
}

export function generateCheckinToken(payload: CheckinTokenPayload): string {
  const expirationDate = new Date(payload.date)
  expirationDate.setHours(23, 59, 59, 999)

  return jwt.sign(payload, CHECKIN_SECRET, {
    expiresIn: Math.floor(expirationDate.getTime() / 1000),
    algorithm: "HS256",
  })
}

export function verifyCheckinToken(token: string): CheckinTokenPayload | null {
  try {
    const decoded = jwt.verify(token, CHECKIN_SECRET, { algorithms: ["HS256"] })
    return decoded as CheckinTokenPayload
  } catch (error) {
    return null
  }
}
