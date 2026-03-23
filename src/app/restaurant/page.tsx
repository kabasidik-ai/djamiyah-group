import Link from "next/link";
import { restaurant } from "@/data/content";

export default function RestaurantPage() {
  const menuItems = [
    {
      category: "Entrées",
      items: [
        { name: "Terrine de foie gras", description: "Compotée de figues et brioche", price: "Prix sur demande" },
        { name: "Saint-Jacques snackées", description: "Purée de chou-fleur et truffe", price: "Prix sur demande" },
        { name: "Salade burrata", description: "Tomates anciennes, basilic, balsamique", price: "Prix sur demande" },
      ],
    },
    {
      category: "Plats principaux",
      items: [
        { name: "Filet mignon", description: "Réduction maison et légumes de saison", price: "Prix sur demande" },
        { name: "Saumon", description: "Poêlé, sauce citronnée aux herbes", price: "Prix sur demande" },
        { name: "Risotto de légumes", description: "Champignons, huile de truffe, parmesan", price: "Prix sur demande" },
        { name: "Poulet guinéen", description: "Poulet local aux épices traditionnelles et riz", price: "Prix sur demande" },
      ],
    },
    {
      category: "Desserts",
      items: [
        { name: "Soufflé au chocolat", description: "Servi chaud avec glace vanille", price: "Prix sur demande" },
        { name: "Crème brûlée", description: "Vanille classique et fruits frais", price: "Prix sur demande" },
        { name: "Sélection de fromages", description: "Fromages locaux et importés", price: "Prix sur demande" },
      ],
    },
  ];

  const mealLabels: Record<string, string> = {
    breakfast: "Petit-déjeuner",
    lunch: "Déjeuner",
    dinner: "Dîner",
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center bg-gradient-to-r from-accent to-primary">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {restaurant.name}
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Une expérience gastronomique mêlant saveurs internationales et locales
          </p>
        </div>
      </section>

      {/* Restaurant Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
                Excellence culinaire
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {restaurant.description}
              </p>
              <ul className="space-y-4 mb-8">
                {restaurant.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-center">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/images/corporate/restaurant-service.webp"
                alt="Service gastronomique Djamiyah"
                className="w-full h-full min-h-[350px] object-cover"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
                <span className="text-sm font-semibold text-[#0D3B3E]">Service premium</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 md:p-10 mb-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-8">
              Horaires d&apos;ouverture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {Object.entries(restaurant.hours).map(([meal, time]) => (
                <div key={meal} className="text-center">
                  <h3 className="text-xl font-semibold capitalize mb-2 text-gray-900">
                    {mealLabels[meal] ?? meal}
                  </h3>
                  <p className="text-lg text-gray-700">{time}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-6">
              Réservation recommandée pour le dîner
            </p>
          </div>

          {/* Menu Highlights */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12">
              Notre carte
            </h2>
            
            {menuItems.map((category, catIdx) => (
              <div key={catIdx} className="mb-12">
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-8 border-b pb-2">
                  {category.category}
                </h3>
                <div className="space-y-6">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex justify-between items-start p-4 hover:bg-gray-50 rounded-lg transition-colors">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h4>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                      <div className="text-primary font-bold text-lg">{item.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-center mt-12">
              <button className="bg-primary hover:bg-amber-600 text-white px-8 py-3.5 rounded-full font-semibold transition-colors">
                Télécharger la carte (PDF)
              </button>
            </div>
          </div>

          {/* Private Dining */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="h-80 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center">
                <div className="text-center text-gray-700 p-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold mb-2">Repas privés</h3>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6">
                  Repas privés et événements
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Organisez vos occasions spéciales dans notre espace dédié, adapté aux groupes et événements.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    <span className="text-gray-700">Options de menu personnalisées</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    <span className="text-gray-700">Équipe de service dédiée</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    <span className="text-gray-700">Équipement audiovisuel disponible</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    <span className="text-gray-700">Accompagnement personnalisé</span>
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="inline-flex items-center bg-primary hover:bg-amber-600 text-white px-6 py-3.5 rounded-full font-semibold transition-colors"
                >
                  Se renseigner
                </Link>
              </div>
            </div>
          </div>

          {/* Reservation CTA */}
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-serif font-bold mb-6">
              Réservez votre table
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Profitez d&apos;une cuisine soignée chez {restaurant.name}. Réservez à l&apos;avance pour garantir votre place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/reservation"
                className="bg-white text-secondary hover:bg-gray-100 px-8 py-3.5 rounded-full font-semibold transition-colors"
              >
                Réserver une table
              </Link>
              <Link
                href="/contact"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-semibold transition-colors"
              >
                Contacter le restaurant
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-flex items-center text-primary hover:text-amber-600 font-semibold text-lg"
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}