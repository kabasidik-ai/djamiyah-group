import { createNotFoundResponse } from '@/lib/not-found-response'

export async function GET(request: Request) {
  return createNotFoundResponse(request)
}
