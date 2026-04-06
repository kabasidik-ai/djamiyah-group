# 🚀 Configuration Rapide Vercel - 5 Minutes

## Étape 1 : Ouvrir le Dashboard Vercel

Allez sur : https://vercel.com/kabasidik-ai/djamiyah-group/settings/environment-variables

## Étape 2 : Ajouter les 3 Variables

### Variable 1 : GHL_API_TOKEN ⚠️ SECRET

1. Cliquez sur **Add New**
2. **Key** : `GHL_API_TOKEN`
3. **Value** : `pit-14f833a7-35fe-4401-b238-530c4658931c`
4. **Environments** : Cocher ✅ **Production** uniquement
5. Cliquez **Save**

⚠️ **NE PAS** ajouter `NEXT_PUBLIC_` devant - c'est un secret côté serveur !

### Variable 2 : NEXT_PUBLIC_GHL_LOCATION_ID

1. Cliquez sur **Add New**
2. **Key** : `NEXT_PUBLIC_GHL_LOCATION_ID`
3. **Value** : `a5wcdv6hapHNnLA9xnl4`
4. **Environments** : Cocher ✅ **Production** uniquement
5. Cliquez **Save**

### Variable 3 : NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID

1. Cliquez sur **Add New**
2. **Key** : `NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID`
3. **Value** : `ryIJEDRGuVTfu5x6uHVE`
4. **Environments** : Cocher ✅ **Production** uniquement
5. Cliquez **Save**

## Étape 3 : Redéployer

1. Allez dans : https://vercel.com/kabasidik-ai/djamiyah-group/deployments
2. Sur le dernier déploiement, cliquez les **3 points** (⋯)
3. Cliquez **Redeploy**
4. Attendez 1-2 minutes

## Étape 4 : Tester

1. Allez sur : https://djamiyah-group.vercel.app
2. Cliquez sur l'avatar de Salematou (coin inférieur droit)
3. Envoyez un message : "Quels sont vos tarifs ?"
4. Salematou devrait répondre ! 🎉

## ✅ Vérification

Les 3 variables doivent apparaître dans le Dashboard Vercel :

```
✅ GHL_API_TOKEN                              [Hidden]
✅ NEXT_PUBLIC_GHL_LOCATION_ID               a5wcdv6hapHNnLA9xnl4
✅ NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID  ryIJEDRGuVTfu5x6uHVE
```

---

**Questions ?** Consultez [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) pour plus de détails.
