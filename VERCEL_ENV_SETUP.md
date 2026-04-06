# Configuration des Variables d'Environnement Vercel

## 🎯 Objectif

Configurer les variables d'environnement GoHighLevel sur Vercel pour que le chatbot Salematou
fonctionne correctement en production.

## 📋 Variables à Configurer

Vous devez configurer ces 3 variables essentielles :

| Variable                                   | Valeur                                     | Description                                     |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------------- |
| `GHL_API_TOKEN`                            | `pit-14f833a7-35fe-4401-b238-530c4658931c` | Token API GoHighLevel (SECRET - ne pas exposer) |
| `NEXT_PUBLIC_GHL_LOCATION_ID`              | `a5wcdv6hapHNnLA9xnl4`                     | ID de l'hôtel Maison Blanche sur GHL            |
| `NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID` | `ryIJEDRGuVTfu5x6uHVE`                     | ID de l'agent AI "Salematou"                    |

## 🚀 Méthode 1 : Configuration Automatique (Recommandé)

### Prérequis

```bash
npm i -g vercel
```

### Exécution

```bash
cd /Users/sidikkaba/Documents/djamiyah-group
./scripts/setup-vercel-env.sh
```

Le script configurera automatiquement toutes les variables pour tous les environnements (Production,
Preview, Development).

## 🖱️ Méthode 2 : Configuration Manuelle via Dashboard Vercel

### 1. Accéder au Dashboard

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet : **djamiyah-group**
3. Cliquez sur **Settings** (dans le menu du haut)
4. Dans le menu latéral, cliquez sur **Environment Variables**

### 2. Ajouter les Variables

Pour chaque variable, suivez ces étapes :

#### Variable 1 : GHL_API_TOKEN

- **Name**: `GHL_API_TOKEN`
- **Value**: `pit-14f833a7-35fe-4401-b238-530c4658931c`
- **Environments**: Cocher ✅ Production, ✅ Preview, ✅ Development
- Cliquer sur **Save**

⚠️ **IMPORTANT** : Cette variable est un SECRET. NE PAS ajouter le préfixe `NEXT_PUBLIC_` car elle
doit rester côté serveur.

#### Variable 2 : NEXT_PUBLIC_GHL_LOCATION_ID

- **Name**: `NEXT_PUBLIC_GHL_LOCATION_ID`
- **Value**: `a5wcdv6hapHNnLA9xnl4`
- **Environments**: Cocher ✅ Production, ✅ Preview, ✅ Development
- Cliquer sur **Save**

#### Variable 3 : NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID

- **Name**: `NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID`
- **Value**: `ryIJEDRGuVTfu5x6uHVE`
- **Environments**: Cocher ✅ Production, ✅ Preview, ✅ Development
- Cliquer sur **Save**

### 3. Redéployer

Après avoir ajouté toutes les variables :

1. Allez dans l'onglet **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**
4. Confirmez le redéploiement

OU utilisez la CLI :

```bash
vercel --prod
```

## 🔍 Vérification

### Vérifier les Variables Configurées

Via CLI :

```bash
vercel env ls
```

Vous devriez voir :

```
Environment Variables (Production)
  GHL_API_TOKEN                              @***********
  NEXT_PUBLIC_GHL_LOCATION_ID               a5wcdv6hapHNnLA9xnl4
  NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID  ryIJEDRGuVTfu5x6uHVE
```

### Tester le Chatbot

1. Attendez que le redéploiement soit terminé (1-2 minutes)
2. Allez sur votre site : https://djamiyah-group.vercel.app
3. Ouvrez le chatbot (cliquez sur l'avatar en bas à droite)
4. Envoyez un message test : "Quels sont vos tarifs ?"
5. Salematou devrait répondre avec des informations de la base de connaissances GHL

## ❓ Troubleshooting

### Le chatbot ne répond pas

1. **Vérifier les logs Vercel** :
   - Dashboard → Deployments → [Dernier déploiement] → Functions
   - Chercher les erreurs dans `/api/chat`

2. **Vérifier les variables** :

   ```bash
   vercel env ls
   ```

   Toutes les 3 variables doivent être présentes

3. **Vérifier GHL** :
   - Connectez-vous à GoHighLevel
   - Allez dans **Conversations**
   - Vérifiez si les messages du chatbot arrivent

### Erreur "API Token Invalid"

- Vérifiez que `GHL_API_TOKEN` est correct
- Vérifiez qu'il n'y a pas de NEXT*PUBLIC* devant GHL_API_TOKEN
- Le token commence par `pit-`

### Erreur "Agent ID not found"

- Vérifiez que l'agent "Salematou" existe dans GHL
- Copiez à nouveau l'Agent ID depuis GHL → Conversation AI → Agents

## 📚 Ressources

- [Documentation Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GoHighLevel API Documentation](https://highlevel.stoplight.io/)
- [Guide complet base de connaissances](./GHL_KNOWLEDGE_BASE_SETUP.md)

## 🔐 Sécurité

⚠️ **NE JAMAIS** :

- Commiter `.env.local` dans Git
- Partager `GHL_API_TOKEN` publiquement
- Exposer le token côté client (pas de NEXT*PUBLIC*)

✅ **TOUJOURS** :

- Garder les tokens secrets
- Configurer les variables dans Vercel Dashboard
- Utiliser `.env.local` pour le développement local uniquement

---

**Note** : Les variables sont déjà configurées localement dans `.env.local`. Cette configuration
concerne uniquement le déploiement sur Vercel.
