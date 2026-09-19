'use client'

// ============================================================
// GroupRequestContent — Sections « Groupes & Séminaires »
// Hôtel Maison Blanche — Coyah (Groupe Djamiyah)
//
// Les salles, chambres et prestations présentées proviennent
// exclusivement des données du projet (src/data/content.ts).
// Aucun prix, capacité, menu ou disponibilité n'est inventé.
// ============================================================

import { conferences, rooms } from '@/data/content'
import GroupRequestForm from './GroupRequestForm'

const usageSalle = (name: string): string => {
  const map: Record<string, string> = {
    Wonkifon: 'Réunions & séminaires restreints',
    Somayah: 'Conférences de taille moyenne',
    Maneah: 'Formations & événements professionnels',
    Soumbouyah: 'Congrès & grands événements professionnels',
  }
  return map[name] ?? 'Événements professionnels'
}

const TYPES_PRO = [
  { titre: 'Séminaires', desc: 'Sessions de stratégie, de cohésion et de montée en compétences.' },
  {
    titre: 'Conférences',
    desc: 'Rencontres sectorielles, panels et prises de parole institutionnelles.',
  },
  { titre: 'Formations', desc: 'Workshops et programmes pratiques pour vos équipes.' },
  {
    titre: 'Réunions',
    desc: 'Comités de direction, réunions partenaires et rendez-vous exécutifs.',
  },
  { titre: 'Groupes professionnels', desc: 'Accueil de délégations et de groupes de travail.' },
  {
    titre: 'Autre événement professionnel',
    desc: 'Un besoin professionnel qui ne correspond pas aux catégories précédentes.',
  },
]

const PRESTATIONS = [
  {
    titre: 'Hébergement',
    desc: 'Nombreuses chambres et suites pour loger vos participants sur place, à Coyah.',
    points: rooms.map((r) => r.name),
  },
  {
    titre: 'Restauration',
    desc: 'Pauses-café, déjeuners et options adaptées aux journées professionnelles.',
    points: ['Pause du matin', 'Déjeuner', 'Pause de l’après-midi', 'Buffet ou service à table'],
  },
  {
    titre: 'Équipement & support',
    desc: 'Un cadre professionnel tourné vers la productivité de vos événements.',
    points: ['Équipement audio-visuel', 'Service de restauration', 'Assistance à la planification'],
  },
]

export default function GroupRequestContent() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Public : entreprises & organisations ── */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="inline-block font-sans text-xs uppercase tracking-[0.25em] text-[#F9A03F] mb-4">
            Entreprises &amp; organisations
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-5">
            Un cadre professionnel pour vos groupes
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            L’Hôtel Maison Blanche à Coyah met à disposition ses espaces pour les événements
            strictement professionnels : séminaires, conférences, formations, réunions et groupes
            professionnels. Chaque demande est étudiée par notre équipe.
          </p>
        </div>
        {/* ── Démarche : confiance + parcours CRM ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-4xl mx-auto mb-16">
          {[
            {
              num: '1',
              titre: 'Votre demande',
              desc: 'Transmise depuis ce formulaire ou via vos échanges avec notre équipe.',
            },
            {
              num: '2',
              titre: 'Vérification humaine',
              desc: 'Salle, hébergement et prestations sont vérifiés par notre équipe.',
            },
            {
              num: '3',
              titre: 'Proposition après étude de votre demande',
              desc: 'Une proposition détaillée vous est adressée (délai indicatif), sans engagement.',
            },
          ].map((s) => (
            <div
              key={s.num}
              className="flex items-start gap-4 rounded-2xl border border-[#EFEDE9] bg-white p-5 shadow-[0_4px_14px_rgba(17,24,39,0.05)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D3B3E] text-white font-serif text-lg">
                {s.num}
              </span>
              <div>
                <h3 className="text-base font-semibold text-[#0D3B3E]">{s.titre}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {TYPES_PRO.map((t) => (
            <div
              key={t.titre}
              className="bg-white p-6 rounded-2xl border border-[#EFEDE9] shadow-[0_4px_14px_rgba(17,24,39,0.05)]"
            >
              <h3 className="text-lg font-semibold text-[#0D3B3E] mb-2">{t.titre}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Salles réellement présentes ── */}
        <div id="salles" className="scroll-mt-24 mb-16">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-4">
              Nos salles à Coyah
            </h2>
            <p className="text-lg text-gray-600">
              Des espaces dédiés aux rencontres et événements professionnels.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {conferences.facilities.map((salle) => (
              <article
                key={salle.name}
                className="bg-white p-6 rounded-2xl border border-[#EFEDE9] shadow-[0_4px_14px_rgba(17,24,39,0.05)]"
              >
                <h3 className="text-xl font-serif font-bold text-[#0D3B3E] mb-1">{salle.name}</h3>
                <p className="text-sm font-medium text-[#F9A03F] mb-3">
                  Capacité : {salle.capacity}
                </p>
                <p className="text-sm text-gray-500 mb-4">{usageSalle(salle.name)}</p>
                <ul className="space-y-1.5">
                  {salle.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F9A03F]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        {/* ── Hébergement, restauration, équipement ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PRESTATIONS.map((p) => (
            <div key={p.titre} className="bg-gray-50 p-7 rounded-2xl border border-[#EFEDE9]">
              <h3 className="text-lg font-semibold text-[#0D3B3E] mb-2">{p.titre}</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{p.desc}</p>
              <ul className="space-y-1.5">
                {p.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D3B3E]" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* ── CTA + Formulaire ── */}
        <div id="formulaire" className="scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0D3B3E] mb-4">
              Demandez une proposition
            </h2>
            <p className="text-lg text-gray-600">
              Complétez le formulaire progressif ci-dessous. Notre équipe vérifie la disponibilité
              de la salle et de l’hébergement avant de préparer votre proposition détaillée.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <GroupRequestForm />
          </div>
        </div>
      </div>
    </section>
  )
}
