# P2 : banc local jetable

Branche basée sur `a00b771`. Ce banc teste PostgreSQL et l’API PostgREST utilisée par supabase-js ;
ce n’est pas une installation complète de Supabase Auth/Storage. Aucun changement de route active ou
de migration historique.

## Exécution

Prérequis : Node/npm du dépôt, Docker accessible sur une socket locale autorisée
(`/var/run/docker.sock` ou `~/.docker/run/docker.sock`), ports loopback 54421 et 54422 libres,
images `postgres:17.6` et `postgrest/postgrest:v13.0.7` téléchargeables.

```sh
npm ci
node scripts/local-tests/run.mjs
npm run type-check
npm test
npm run build
```

Ne pas charger `.env.local`, un profil de production ou les credentials cloud. Le lanceur refuse les
variables `PG*`, `POSTGRES*`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE*`, `NEXT_PUBLIC_SUPABASE*`,
`API_URL`, `SERVICE_ROLE_KEY`, ainsi que `NODE_ENV=production` et les environnements Vercel. Il
ignore les sélecteurs de contexte Docker et utilise exclusivement le socket local. Aucun `db reset`,
`db push`, `supabase link`, montage de données ou serveur SQL existant.

Le lanceur génère ses noms, crée un réseau Docker bridge local **non interne**, une base neuve en
mémoire et une API publiée sur loopback uniquement (`127.0.0.1:54422` en amont, `127.0.0.1:54421`
via gateway). Il détruit uniquement les conteneurs qu’il a créés et son réseau. Une collision de
port échoue ; il ne tue jamais le processus occupant le port. En cas d’arrêt brutal, les ressources
préfixées `p2-bench-` de cette exécution peuvent rester à inspecter manuellement.

## Connexions et séparation des identifiants

Les tests ordinaires ne se connectent pas à une base. Le lanceur fournit aux seuls tests
d’intégration `P2_TEST_ENABLE=1`, `P2_TEST_API_URL`, `P2_TEST_SERVICE_ROLE_KEY` et un
`P2_TEST_BENCH_ID` UUID aléatoire. Ces variables ne sont pas des variables applicatives. La clé JWT
est une fixture publique de test, jamais une clé de production. Toute autre clé est refusée.

Seul le littéral `http://127.0.0.1:54421` est accepté. Pas de DNS, localhost, adresse privée
distante, forme IPv4 alternative, IPv6, userinfo, query, fragment ou URL normalisée. Chaque requête
est revalidée ; les redirections HTTP sont interdites. Avant les premières écritures, une RPC en
lecture doit restituer l’identifiant aléatoire du banc. Un service local préexistant ne suffit pas.

Les connexions SQL du lanceur passent par `docker exec psql -X --no-password` dans son propre
conteneur, sans URL, service libpq, fichier utilisateur ou port PostgreSQL publié. La connexion
interne PostgREST est une constante `db:5432` sur le réseau privé créé pour cette exécution. Aucun
hôte externe configurable. Le validateur `assertLocalPostgresUrl` couvre les futurs clients SQL
directs : hôte numérique loopback, port 55432 et nom de base de test stricts, sans aucun paramètre
libpq ambigu ; transmettre ses champs validés, jamais l’URL brute.

Ce dispositif empêche les connexions distantes accidentelles du banc. Il ne constitue pas une
sandbox contre quelqu’un qui modifie le code ou configure volontairement un tunnel local vers un
serveur distant.

## Reconstruction et historique

Le plan explicite commence par `schema.sql`, puis un complément **local seulement** pour les labels
enum `pending`/`awaiting_confirmation` et `reservations.room_id`. Les labels sont validés avant la
migration conférence. Aucun seed hôtel réel n’est importé ; les fixtures SQL incluent explicitement
slug et unités.

Les deux fichiers historiques `002_*` sont appliqués séparément, dans un ordre explicite. Le
registre `p2_bench.applied_files` utilise le chemin complet et SHA-256, pas la version numérique du
CLI Supabase. Un second passage saute chaque fichier déjà appliqué, notamment `002_ghl_oauth.sql` :
le trigger et les policies ne sont pas recréés. Un fichier historique modifié provoque un refus. Une
exécution SQL échouée fait échouer le banc ; une nouvelle exécution recrée une base neuve.

Cela répare la reconstruction **du banc** sans renommer, réécrire ou réparer l’historique d’une base
existante. Cela ne corrige pas le rejeu brut des migrations par Supabase Preview : ce travail
nécessitera un audit distinct de son historique.

## Couverture et limites de validation

Le lanceur reconstruit puis rejoue le plan ; les assertions SQL vérifient le trigger GHL unique, les
deux migrations 002, la RPC `reserve_room`, l’index des tentatives et RLS. Il lance ensuite les
tests existants de l’adaptateur : roundtrip, conflits réels 23505, claim, 10 insertions
concurrentes, blocage `unknown`. Les tests de sécurité simulent URL distantes, paramètres ambigus,
variables de production, mauvaise clé, marqueur erroné et transport/redirections.

Dans Codex, Docker est disponible mais Docker Hub est refusé (`Forbidden`). Une vérification
complémentaire du plan a réussi avec PostgreSQL 17.11 natif dans un cluster neuf sous `/tmp`, socket
Unix privé, aucune écoute TCP : reconstruction, second passage et assertions SQL réussis. Le serveur
a été arrêté. Le banc complet Docker + PostgREST et ses intégrations restent à valider quand les
images seront disponibles ; ne pas confondre ces deux niveaux de validation.
