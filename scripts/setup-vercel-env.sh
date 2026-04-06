#!/bin/bash

# ============================================================
# Script de configuration des variables Vercel
# Groupe Djamiyah - Maison Blanche de Coyah
# ============================================================

echo "🚀 Configuration des variables d'environnement Vercel..."
echo ""

# Vérifier que vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé."
    echo "📦 Installation: npm i -g vercel"
    exit 1
fi

# Variables GHL
GHL_API_TOKEN="pit-14f833a7-35fe-4401-b238-530c4658931c"
GHL_LOCATION_ID="a5wcdv6hapHNnLA9xnl4"
GHL_AGENT_ID="ryIJEDRGuVTfu5x6uHVE"

echo "📝 Configuration des variables GoHighLevel..."

# Configurer les variables pour Production
vercel env add GHL_API_TOKEN production <<< "$GHL_API_TOKEN"
vercel env add NEXT_PUBLIC_GHL_LOCATION_ID production <<< "$GHL_LOCATION_ID"
vercel env add NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID production <<< "$GHL_AGENT_ID"

echo ""
echo "✅ Variables configurées pour Production"
echo ""
echo "Configuration pour Preview et Development..."

# Configurer pour Preview
vercel env add GHL_API_TOKEN preview <<< "$GHL_API_TOKEN"
vercel env add NEXT_PUBLIC_GHL_LOCATION_ID preview <<< "$GHL_LOCATION_ID"
vercel env add NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID preview <<< "$GHL_AGENT_ID"

# Configurer pour Development
vercel env add GHL_API_TOKEN development <<< "$GHL_API_TOKEN"
vercel env add NEXT_PUBLIC_GHL_LOCATION_ID development <<< "$GHL_LOCATION_ID"
vercel env add NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID development <<< "$GHL_AGENT_ID"

echo ""
echo "✅ Variables configurées pour tous les environnements !"
echo ""
echo "📋 Variables configurées :"
echo "  - GHL_API_TOKEN"
echo "  - NEXT_PUBLIC_GHL_LOCATION_ID"
echo "  - NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID"
echo ""
echo "🔄 Pour voir les variables actuelles :"
echo "   vercel env ls"
echo ""
echo "🚀 Pour redéployer avec les nouvelles variables :"
echo "   vercel --prod"
echo ""
echo "✨ Configuration terminée !"
