# FIX DÉFINITIF CHATBOT - ACTION REQUISE

## Problème identifié

Le chatbot répond avec les **tarifs chambres** même pour les questions sur **salles de conférence**.

**Cause racine** : Le prompt GHL Djami n'a pas été mis à jour avec les instructions de routage par
contexte.

---

## Solution définitive (ACTION MANUELLE REQUISE)

### ⚠️ Action à faire MAINTENANT dans GHL

1. **Connectez-vous à GoHighLevel**
   - URL: https://app.gohighlevel.com/
   - Sub-account: **Groupe Djamiyah**

2. **Menu → Conversations → Settings → Conversation AI**

3. **Cliquez sur "Djami" → Edit**

4. **Remplacez le prompt actuel par le contenu du fichier `GHL-PROMPT-SALEMATOU.md`**
   - Copiez TOUT le contenu de `GHL-PROMPT-SALEMATOU.md`
   - Collez-le dans le champ "System Prompt"
   - Vérifiez que les sections **ROUTAGE PAR CONTEXTE** et **FLUX 1, 2, 3** sont présentes

5. **Cliquez "Save"**

---

## Pourquoi c'est indispensable ?

Sans ce prompt, GHL ignore les préfixes `[Salle conférence]` que le code ajoute automatiquement et
répond toujours avec les informations chambres par défaut.

Le nouveau prompt contient :

```markdown
## 🎯 ROUTAGE PAR CONTEXTE (PRIORITAIRE)

### Détection du prefixe

- `[Salle conférence]` → FLUX 2 (Corporate)
- `[Chambre hôtel]` → FLUX 1 (Hébergement)
- `[Restaurant]` → FLUX 3 (Gastronomie)
- Pas de préfixe → Clarifier avant de répondre
```

---

## Vérification

Après mise à jour, testez sur https://djamiyahgroup.com :

| Question                                   | Réponse attendue                                             |
| ------------------------------------------ | ------------------------------------------------------------ |
| "Je veux réserver une salle de conférence" | Infos salles Wonkifon/Maneah/Soumbouya (PAS tarifs chambres) |
| "je veux une chambre"                      | Tarifs chambres 520k-1520k GNF                               |

---

## Script automatique (optionnel après fix manuel)

Pour automatiser les futures mises à jour :

```bash
cd /Users/sidikkaba/Documents/djamiyah-group
node scripts/update-ghl-prompt.js
```

(Nécessite GHL_API_TOKEN et GHL_CONVERSATION_AI_AGENT_ID dans .env)
