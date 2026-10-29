import { NextResponse } from 'next/server'

const MARKDOWN_404 = `# 404 — Page introuvable / Not Found

L'adresse demandée n'existe pas sur le site du **Groupe Djamiyah** ou a été déplacée.

- Accueil : https://djamiyahgroup.com/
- Sommaire pour les agents (LLMs) : https://djamiyahgroup.com/llms.txt
- Chambres & suites : https://djamiyahgroup.com/chambres
- Contact : https://djamiyahgroup.com/contact

Corrigez l'URL ou explorez le sommaire ci-dessus.
Statut HTTP : 404 — généré automatiquement.
`

const HTML_404 = `<!DOCTYPE html>
<html lang="fr">
  <head><meta charset="utf-8" /><title>404 — Page introuvable</title></head>
  <body style="font-family: sans-serif; text-align: center; padding: 4rem">
    <h1 style="color: #F9A03F">404</h1>
    <p>Page introuvable — Groupe Djamiyah (djamiyahgroup.com)</p>
    <p><a href="/">← Retour à l'accueil</a></p>
  </body>
</html>`

function acceptsMarkdown(accept: string): boolean {
  return accept.split(',').some((entry) => {
    const [mediaType, ...parameters] = entry.split(';').map((part) => part.trim().toLowerCase())

    if (mediaType !== 'text/markdown') return false

    const quality = parameters.find((parameter) => parameter.startsWith('q='))
    if (!quality) return true

    const value = Number.parseFloat(quality.slice(2))
    return Number.isFinite(value) && value > 0
  })
}

export function createNotFoundResponse(request: Request): NextResponse {
  const accept = request.headers.get('accept') ?? ''

  if (acceptsMarkdown(accept)) {
    return new NextResponse(MARKDOWN_404, {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  }

  return new NextResponse(HTML_404, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
