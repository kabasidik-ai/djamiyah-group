import { NextResponse } from 'next/server'

// ── Page 404 conforme pour agents IA / LLM (négociation de contenu) ─────────
// Retourne un vrai statut HTTP 404 ET un corps Markdown (Content-Type:
// text/markdown) pour les clients qui en font la demande via l'en-tête
// `Accept: text/markdown`. Les navigateurs classiques reçoivent un HTML 404.

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

export async function GET(request: Request) {
  const accept = request.headers.get('accept') ?? ''

  if (accept.includes('text/markdown')) {
    return new NextResponse(MARKDOWN_404, {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  }

  // Fallback navigateur : code 404 conservé, page simple en HTML.
  return new NextResponse(HTML_404, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
