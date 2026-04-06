# Configuration de la Base de Connaissances GHL - Groupe Djamiyah

## Vue d'ensemble

Le chatbot Salematou est connecté à GoHighLevel (GHL) Conversation AI avec une base de
connaissances. Cette base de connaissances permet à l'IA de répondre aux questions des visiteurs en
utilisant les informations spécifiques de votre hôtel.

## Architecture

```
Widget Frontend (ConciergeWidget.tsx)
    ↓
API Next.js (/api/chat/route.ts)
    ↓
GHL Conversation AI Agent + Base de Connaissances
    ↓
Réponse personnalisée basée sur vos documents
```

## Configuration dans GoHighLevel

### 1. Accéder à Conversation AI

1. Connectez-vous à votre compte GHL
2. Allez dans **Settings** → **Conversation AI**
3. Trouvez ou créez l'agent "Salematou"

### 2. Configurer l'Agent AI

- **Nom** : Salematou
- **Rôle** : Concierge virtuelle de La Maison Blanche
- **Instructions personnalisées** :

  ```
  Tu es Salematou, la concierge virtuelle professionnelle du Groupe Djamiyah.
  Tu représentes La Maison Blanche de Coyah et l'Hôtel Rama de Kissidougou.

  Ton rôle :
  - Accueillir chaleureusement les visiteurs
  - Répondre aux questions sur les chambres, tarifs, services
  - Aider à organiser des événements et séminaires
  - Fournir des informations sur les restaurants
  - Faciliter les réservations

  Style de communication :
  - Professionnel mais chaleureux
  - Utilise le français de Guinée
  - Réponds de manière concise et claire
  - Propose toujours une action concrète (réservation, contact, etc.)
  ```

### 3. Ajouter des Documents à la Base de Connaissances

Créez et uploadez les documents suivants dans la Knowledge Base :

#### Document 1 : Informations sur l'hôtel

```markdown
# La Maison Blanche de Coyah

## Localisation

Coyah, Guinée

## Types de chambres disponibles

### Chambre Confort

- Tarif : [VOTRE_TARIF] GNF/nuit
- Capacité : 1-2 personnes
- Équipements : Climatisation, TV, Wi-Fi, salle de bain privée

### Chambre Premium

- Tarif : [VOTRE_TARIF] GNF/nuit
- Capacité : 2 personnes
- Équipements : Climatisation, TV écran plat, Wi-Fi, mini-bar, salle de bain premium

### Suite Premium

- Tarif : [VOTRE_TARIF] GNF/nuit
- Capacité : 2-3 personnes
- Équipements : Salon séparé, climatisation, TV écran plat, Wi-Fi, mini-bar, salle de bain luxe

### Suite Prestige

- Tarif : [VOTRE_TARIF] GNF/nuit
- Capacité : 2-4 personnes
- Équipements : Large salon, chambre séparée, climatisation, 2 TV, Wi-Fi, mini-bar, balcon, salle de
  bain luxe

## Services de l'hôtel

- Restaurant gastronomique
- Bar
- Piscine
- Parking sécurisé
- Service en chambre 24/7
- Wi-Fi gratuit
- Salle de conférence

## Contact

- Téléphone : +224 XXX XXX XXX
- Email : contact@groupedjamiyah.com
- Site web : https://groupedjamiyah.com
```

#### Document 2 : Salles de conférence

```markdown
# Salles de Conférence - Groupe Djamiyah

## Salle Maneah

- Capacité : 40-50 personnes
- Configuration : Théâtre, classe, U
- Équipements : Projecteur, écran, sonorisation, climatisation, Wi-Fi
- Tarif : [VOTRE_TARIF] GNF/jour

## Salle Soumbouya

- Capacité : 20-30 personnes
- Configuration : Réunion, classe
- Équipements : TV écran plat, climatisation, Wi-Fi
- Tarif : [VOTRE_TARIF] GNF/jour

## Services Événements

- Coffee break
- Déjeuner d'affaires
- Support technique
- Matériel audiovisuel

## Réservation

Pour réserver une salle de conférence :

- Téléphone : +224 XXX XXX XXX
- Email : evenements@groupedjamiyah.com
- Délai de réservation : 48h minimum
```

#### Document 3 : Restaurant

```markdown
# Restaurant - La Maison Blanche

## Spécialités

- Cuisine guinéenne authentique
- Cuisine internationale
- Grillades
- Plats végétariens

## Horaires

- Petit-déjeuner : 6h30 - 10h00
- Déjeuner : 12h00 - 15h00
- Dîner : 19h00 - 22h30

## Services

- Service en salle
- Service en chambre
- Commandes à emporter
- Événements privés

## Prix moyens

- Petit-déjeuner : [TARIF] GNF
- Plat principal : [TARIF] GNF
- Menu complet : [TARIF] GNF
```

#### Document 4 : Politique de réservation

```markdown
# Politique de Réservation - Groupe Djamiyah

## Réservation

- En ligne : https://groupedjamiyah.com/reservation
- Par téléphone : +224 XXX XXX XXX
- Par email : reservation@groupedjamiyah.com

## Conditions

- Check-in : 14h00
- Check-out : 12h00
- Pièce d'identité requise
- Paiement à l'arrivée ou en ligne

## Modes de paiement acceptés

- Espèces (GNF, USD, EUR)
- Orange Money
- MTN Mobile Money
- Cartes bancaires

## Politique d'annulation

- Annulation gratuite jusqu'à 48h avant l'arrivée
- Annulation tardive : 1 nuit facturée
- No-show : totalité du séjour facturé

## Politique enfants

- Enfants de moins de 5 ans : gratuit
- Enfants de 5-12 ans : 50% du tarif
- Lit bébé disponible sur demande
```

### 4. Récupérer l'Agent ID

1. Dans GHL, allez sur votre agent "Salematou"
2. Copiez l'**Agent ID** (format : `ryIJEDRGuVTfu5x6uHVE`)
3. Ajoutez-le dans votre fichier `.env.local` :
   ```
   NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID=votre_agent_id_ici
   ```

### 5. Configurer les Variables d'Environnement

Assurez-vous que ces variables sont configurées dans Vercel :

```env
# GHL API Token (trouvé dans Settings → API)
GHL_API_TOKEN=votre_token_api_ghl

# Location ID (trouvé dans Settings → Business Profile)
NEXT_PUBLIC_GHL_LOCATION_ID=votre_location_id

# Agent ID (voir étape 4)
NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID=votre_agent_id
```

## Test de la Configuration

### 1. Test Local

1. Vérifiez que toutes les variables d'environnement sont définies
2. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
3. Ouvrez le chatbot sur votre site
4. Testez avec des questions comme :
   - "Quels sont les tarifs des chambres ?"
   - "Je veux organiser un séminaire pour 40 personnes"
   - "Quels sont les horaires du restaurant ?"

### 2. Vérification des Réponses

L'IA devrait :

- ✅ Répondre en utilisant les informations de votre base de connaissances
- ✅ Être cohérente avec votre marque (Groupe Djamiyah)
- ✅ Proposer des actions concrètes (réservation, contact)
- ✅ Être professionnelle et chaleureuse

### 3. Logs GHL

Pour vérifier que tout fonctionne :

1. Allez dans GHL → **Conversations**
2. Vous devriez voir les conversations avec `widget-[session]@djamiyah-chatbot.web`
3. Vérifiez que l'agent AI répond correctement

## Amélioration Continue

### Ajouter Plus de Documents

Plus vous ajoutez de documents pertinents, meilleures seront les réponses :

- FAQ clients
- Informations sur les attractions locales
- Offres spéciales et promotions
- Politique COVID-19
- Informations sur le transport

### Analyser les Conversations

1. Consultez régulièrement les conversations dans GHL
2. Identifiez les questions récurrentes mal comprises
3. Ajoutez des documents pour couvrir ces sujets
4. Affinez les instructions de l'agent si nécessaire

### Mise à Jour des Tarifs

Quand vous changez vos tarifs :

1. Mettez à jour les documents dans la base de connaissances GHL
2. L'IA utilisera automatiquement les nouvelles informations
3. Aucun redéploiement du site nécessaire

## Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans Vercel
2. Consultez la console GHL pour voir les erreurs API
3. Assurez-vous que l'Agent ID est correct
4. Vérifiez que les documents sont bien importés dans la Knowledge Base

## Bonnes Pratiques

1. **Documents clairs** : Écrivez des documents concis et bien structurés
2. **Mise à jour régulière** : Gardez les informations à jour
3. **Test fréquent** : Testez le chatbot après chaque modification
4. **Formation** : L'IA apprend des conversations, plus elle est utilisée, meilleure elle devient
5. **Monitoring** : Surveillez les conversations pour identifier les améliorations possibles

---

**Note** : La base de connaissances GHL est la clé pour avoir un chatbot pertinent et utile.
Investissez du temps dans la création de documents de qualité pour offrir la meilleure expérience à
vos clients.
