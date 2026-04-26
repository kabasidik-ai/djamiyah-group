# WORKFLOW GHL — Lead Hôtel Groupe Djamiyah

Guide complet de configuration dans GoHighLevel. À suivre étape par étape dans le dashboard GHL.

---

## 📋 PRÉ-REQUIS

Avant de créer le workflow, configurez d'abord :

### 1. Pipeline (Opportunités)

**GHL** → Opportunités → Paramètres → Créer Pipeline

**Nom du pipeline** : `Lead Hôtel Djamiyah`

**Stages (5)** : | # | Nom | Description | |---|-----|-------------| | 1 | Nouveau Lead | Premier
contact via chat | | 2 | En cours | Conversation en cours avec Salematou | | 3 | Qualifié |
Téléphone obtenu + type demande identifié | | 4 | Réservation envoyée | Lien de réservation transmis
| | 5 | Confirmé | Réservation confirmée ou devis envoyé |

### 2. Tags à créer

**GHL** → Paramètres → Tags → Créer chaque tag :

| Tag               | Couleur   | Description                 |
| ----------------- | --------- | --------------------------- |
| `lead-hotel`      | 🔵 Bleu   | Tout lead via chat widget   |
| `lead-chambre`    | 🟢 Vert   | Demande de chambre          |
| `lead-salle`      | 🟡 Orange | Demande de salle conférence |
| `lead-restaurant` | 🔴 Rouge  | Demande restaurant          |
| `lead-qualifie`   | ⭐ Or     | Téléphone obtenu            |
| `lead-anonyme`    | ⚪ Gris   | Pas de téléphone            |

### 3. Custom Fields

**GHL** → Paramètres → Custom Fields → Créer :

| Champ             | Type                                      | Objet   |
| ----------------- | ----------------------------------------- | ------- |
| `Type de demande` | Dropdown (Chambre/Salle/Restaurant/Autre) | Contact |
| `Date demande`    | Date                                      | Contact |
| `Source lead`     | Texte                                     | Contact |

---

## 🔄 WORKFLOW PRINCIPAL

### GHL → Automation → Workflows → Create Workflow

**Nom** : `Lead Hôtel - Capture & Qualification`

---

### ÉTAPE 1 — TRIGGER

**Trigger type** : `Customer Replied`

**Configuration** :

- Channel : `Live Chat`
- Assignment : Tous les utilisateurs
- Réponse du client (inbound)

**Note** : Ce trigger se déclenche quand un visiteur envoie un message via le chat widget.

---

### ÉTAPE 2 — CREATE/UPDATE CONTACT

**Action type** : `Create/Update Contact`

**Configuration** :

- First Name : `{{contact.first_name}}` (si capturé par le widget)
- Last Name : `{{contact.last_name}}`
- Email : `{{contact.email}}`
- Phone : `{{contact.phone}}`
- Tags à ajouter : `lead-hotel`
- Source : `Chat Widget - djamiyah-group.vercel.app`

---

### ÉTAPE 3 — QUALIFICATION PAR MOTS-CLÉS

**Action type** : `If/Else` (Condition)

**Branche 1** — Message contient "chambre" OU "suite" OU "nuit" OU "séjour" OU "tarif" OU "prix" :

```
→ Action : Add Tag
   Tags : lead-chambre
→ Action : Update Custom Field
   Type de demande = "Chambre"
```

**Branche 2** — Message contient "salle" OU "conférence" OU "séminaire" OU "réunion" OU "formation"
OU "événement" :

```
→ Action : Add Tag
   Tags : lead-salle
→ Action : Update Custom Field
   Type de demande = "Salle"
```

**Branche 3** — Message contient "restaurant" OU "repas" OU "dîner" OU "déjeuner" OU "menu" :

```
→ Action : Add Tag
   Tags : lead-restaurant
→ Action : Update Custom Field
   Type de demande = "Restaurant"
```

**Branche 4** — Autre (default) :

```
→ Action : Update Custom Field
   Type de demande = "Autre"
```

---

### ÉTAPE 4 — VÉRIFICATION TÉLÉPHONE (Qualification)

**Action type** : `If/Else` (Condition)

**Condition** : `Contact Phone` est défini (non vide)

**OUI (Lead Qualifié)** :

```
→ Action : Add Tag
   Tags : lead-qualifie
→ Action : Create Opportunity
   Pipeline : Lead Hôtel Djamiyah
   Stage : Qualifié
   Title : "Lead {{contact.first_name}} - {{custom_field.type_de_demande}}"
   Value : 0 (à mettre à jour manuellement)
```

**NON (Lead Anonyme)** :

```
→ Action : Add Tag
   Tags : lead-anonyme
→ Action : Create Opportunity
   Pipeline : Lead Hôtel Djamiyah
   Stage : Nouveau Lead
   Title : "Lead anonyme - Chat"
```

---

### ÉTAPE 5 — AJOUTER NOTE AUTOMATIQUE

**Action type** : `Add Note to Contact`

**Contenu de la note** :

```
📋 Nouveau lead via Chat Widget
━━━━━━━━━━━━━━━━━━━━━━━
Type : {{custom_field.type_de_demande}}
Tag : lead-qualifie / lead-anonyme
Message : {{message.body}}
Date : {{current_date}}
Source : djamiyah-group.vercel.app
━━━━━━━━━━━━━━━━━━━━━━━
```

---

### ÉTAPE 6 — ACTION DE CONVERSION (si Lead Qualifié)

**Action type** : `If/Else` (Condition)

**Condition** : Tag `lead-qualifie` est présent

**OUI** → **Action type** : `Send Message` (Live Chat)

**Message** :

```
Parfait ! Pour finaliser votre réservation, vous pouvez réserver directement ici :
👉 https://djamiyah-group.vercel.app/fr/reservation

Ou appelez-nous au +224 610 75 90 90.
Notre équipe vous confirme sous 30 minutes !
```

**Puis** → **Action type** : `Update Opportunity`

- Stage : `Réservation envoyée`

---

### ÉTAPE 7 — NOTIFICATION INTERNE

**Action type** : `Internal Notification`

**Notification Email** à : contact@djamiyah.com

**Sujet** : 🔥 Nouveau lead chaud - {{custom_field.type_de_demande}}

**Corps email** :

```
Nouveau lead via Chat Widget !

Client : {{contact.first_name}} {{contact.last_name}}
Téléphone : {{contact.phone}}
Email : {{contact.email}}
Type : {{custom_field.type_de_demande}}
Tag : lead-qualifié

Dernier message :
{{message.body}}

🔗 Voir le contact : https://app.gohighlevel.com/contacts/detail/{{contact.id}}

Action requise : Contacter sous 30 minutes !
```

**+ Notification SMS** à : +224610759090

**Message SMS** :

```
Lead {{custom_field.type_de_demande}}: {{contact.first_name}} {{contact.phone}} - Contacter ASAP
```

---

### ÉTAPE 8 — MISE À JOUR PIPELINE

**Action type** : `If/Else`

**Si** tag `lead-qualifie` + tag `lead-chambre` :

```
→ Update Opportunity → Stage : Qualifié
```

**Si** tag `lead-qualifie` + action réservation envoyée :

```
→ Update Opportunity → Stage : Réservation envoyée
```

---

## 🔄 WORKFLOW 2 — FOLLOW-UP AUTOMATIQUE

### GHL → Automation → Workflows → Create Workflow

**Nom** : `Lead Hôtel - Follow-up`

### TRIGGER

**Trigger type** : `Tag Added` **Tag** : `lead-qualifie`

---

### ÉTAPE J+1 — RELANCE

**Action type** : `Wait` → 1 jour (24h)

**Action type** : `If/Else` **Condition** : Opportunity stage ≠ `Confirmé`

**OUI** → **Action type** : `Send Message` (Live Chat)

**Message** :

```
Bonjour {{contact.first_name}} ! 👋
C'est Salematou de La Maison Blanche.
Avez-vous pu finaliser votre réservation ?
Je reste disponible pour toute question.
→ https://djamiyah-group.vercel.app/fr/reservation
```

---

### ÉTAPE J+3 — RAPPEL DOUX

**Action type** : `Wait` → 2 jours supplémentaires (J+3 total)

**Action type** : `If/Else` **Condition** : Opportunity stage ≠ `Confirmé`

**OUI** → **Action type** : `Send Message` (Live Chat)

**Message** :

```
Bonjour {{contact.first_name}} ! 😊
Je me permets de revenir vers vous.
Nos chambres sont très demandées en ce moment.
Souhaitez-vous que je vérifie la disponibilité pour vos dates ?
Appelez-nous au +224 610 75 90 90 ou réservez en ligne :
→ https://djamiyah-group.vercel.app/fr/reservation
```

---

### ÉTAPE J+7 — OFFRE SPÉCIALE

**Action type** : `Wait` → 4 jours supplémentaires (J+7 total)

**Action type** : `If/Else` **Condition** : Opportunity stage ≠ `Confirmé`

**OUI** → **Action type** : `Send Message` (Live Chat)

**Message** :

```
Bonjour {{contact.first_name}} ! 🌟
Le Groupe Djamiyah vous offre une attention spéciale :
Réservez cette semaine et profitez d'un welcome drink offert !
→ https://djamiyah-group.vercel.app/fr/reservation
Ou appelez-nous au +224 610 75 90 90.
Au plaisir de vous accueillir ! 🏨
```

**Puis** → **Action type** : `Remove Tag`

- Tag : `lead-qualifie`
- Tag : `lead-chambre` / `lead-salle` / `lead-restaurant`

**Puis** → **Action type** : `Add Tag`

- Tag : `lead-termine`

---

## 🔄 WORKFLOW 3 — FALLBACK WHATSAPP

### GHL → Automation → Workflows → Create Workflow

**Nom** : `Lead Hôtel - Fallback WhatsApp`

### TRIGGER

**Trigger type** : `Tag Added` **Tag** : `lead-qualifie`

### WAIT 30 minutes

**Action type** : `Wait` → 30 minutes

### VÉRIFICATION

**Action type** : `If/Else` **Condition** : Aucune réponse du client (pas de message inbound depuis
30 min)

**OUI** → **Action type** : `Send Message` (Live Chat)

**Message** :

```
{{contact.first_name}}, je remarque que vous n'avez pas encore finalisé.
N'hésitez pas à nous appeler directement :
📞 +224 610 75 90 90 (WhatsApp et appel)
Ou réservez en ligne :
→ https://djamiyah-group.vercel.app/fr/reservation

À très bientôt ! 🙏
```

---

## 📊 RÉCAPITULATIF WORKFLOWS

| Workflow          | Trigger                      | Actions clés                           |
| ----------------- | ---------------------------- | -------------------------------------- |
| Lead Capture      | Customer Replied (Live Chat) | Tag, Qualification, Note, Notification |
| Follow-up         | Tag lead-qualifie            | J+1 relance, J+3 rappel, J+7 offre     |
| Fallback WhatsApp | Tag lead-qualifie            | Message 30min après si pas de réponse  |

## 📊 PIPELINE FINAL

```
Nouveau Lead → En cours → Qualifié → Réservation envoyée → Confirmé
    ↓              ↓          ↓              ↓
 lead-anonyme  Conversation  lead-qualifie  Lien envoyé
                            + téléphone     + confirmation
```

## ⚡ ACTIONS IMMÉDIATES DANS GHL

1. **Créer le pipeline** : Opportunités → Paramètres → 5 stages
2. **Créer les tags** : 6 tags (lead-hotel, lead-chambre, lead-salle, lead-restaurant,
   lead-qualifie, lead-anonyme)
3. **Créer les custom fields** : 3 champs (Type demande, Date demande, Source lead)
4. **Créer Workflow 1** : Lead Capture & Qualification
5. **Créer Workflow 2** : Follow-up automatique
6. **Créer Workflow 3** : Fallback WhatsApp
7. **Publier les 3 workflows** : ON
8. **Tester** : Envoyer un message via le chat widget et vérifier le pipeline
