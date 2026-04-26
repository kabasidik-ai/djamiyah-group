# GHL Workflow - Réservation Maison Blanche

## Configuration du Workflow

### 1. Trigger (Déclencheur)

**Problème : "Calendar not found"**

**Solutions :**

- Ouvre la dropdown des calendriers
- Sélectionne le calendrier existant "Maison Blanche Booking"
- Ou supprime le filtre si aucun calendrier n'apparaît

### 2. Action : Create Opportunity

Configure OBLIGATOIREMENT ces champs :

| Champ        | Valeur                              |
| ------------ | ----------------------------------- |
| **Pipeline** | `Réservations Hôtel Maison Blanche` |
| **Stage**    | `Nouvelle Réservation`              |
| **Name**     | `{{contact.name}} - Réservation`    |
| **Source**   | `Calendrier GHL`                    |
| **Value**    | `0`                                 |

**Après configuration :** Clique **"Save Action"** ✅

### 3. Publication et Test

1. Clique **"Publish"** pour publier le workflow
2. Créé un RDV fictif dans le calendrier GHL
3. Vérifie dans GHL qu'une Opportunity est créée

## Erreurs Courantes

| Erreur                 | Solution                              |
| ---------------------- | ------------------------------------- |
| "Calendar not found"   | Sélectionner calendrier dans dropdown |
| Pipeline introuvable   | Vérifier existence pipeline dans GHL  |
| Variables non résolues | Vérifier `{{contact.name}}` existe    |

## IDs GHL Maison Blanche

```
Location ID: a5wcdv6hapHNnLA9xnl4
Business ID: ORWCLXIGJ8k42yscyNzt
Calendar ID: maison-blanche-booking
```
