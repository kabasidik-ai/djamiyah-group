import Link from "next/link";
import { restaurant, siteConfig } from "@/data/content";

export default function RestaurantPage() {
  const menuItems = [
    {
      category: "Starters",
      items: [
        { name: "Foie Gras Terrine", description: "With fig compote and brioche", price: 24 },
        { name: "Seared Scallops", description: "With cauliflower purée and truffle", price: 28 },
        { name: "Burrata Salad", description: "Heirloom tomatoes, basil, balsamic", price: 22 },
      ],
    },
    {
      category: "Main Courses",
      items: [
        { name: "Filet Mignon", description: "8oz with red wine reduction, seasonal vegetables", price: 42 },
        { name: "Atlantic Salmon", description: "Pan-seared with lemon dill sauce", price: 36 },
        { name: "Vegetable Risotto", description: "Wild mushrooms, truffle oil, parmesan", price: 28 },
        { name: "Guinean Chicken", description: "Local chicken with traditional spices and rice", price: 32 },
      ],
    },
    {
      category: "Desserts",
      items: [
        { name: "Chocolate Soufflé", description: "Warm with vanilla ice cream", price: 18 },
        { name: "Crème Brûlée", description: "Classic vanilla with fresh berries", price: 16 },
        { name: "Cheese Selection", description: "Local and imported cheeses", price: 22 },
      ],
    },
  ];

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
            Gourmet dining experience with international and local flavors
          </p>
        </div>
      </section>

      {/* Restaurant Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
                Culinary Excellence
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
            <div className="h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
              <div className="text-center text-gray-700 p-8">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-2xl font-bold mb-2">Restaurant Interior</h3>
                <p className="text-sm">TODO: Replace with restaurant ambiance photos</p>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 md:p-10 mb-20">
            <h2 className="text-3xl font-serif font-bold text-center mb-8">
              Opening Hours
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {Object.entries(restaurant.hours).map(([meal, time]) => (
                <div key={meal} className="text-center">
                  <h3 className="text-xl font-semibold capitalize mb-2 text-gray-900">
                    {meal}
                  </h3>
                  <p className="text-lg text-gray-700">{time}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-6">
              Reservations recommended for dinner service
            </p>
          </div>

          {/* Menu Highlights */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12">
              Menu Highlights
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
                      <div className="text-primary font-bold text-lg">
                        ${item.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">
                View our complete menu with wine pairings and seasonal specials
              </p>
              <button className="bg-primary hover:bg-amber-600 text-white px-8 py-3.5 rounded-full font-semibold transition-colors">
                Download Full Menu (PDF)
              </button>
            </div>
          </div>

          {/* Wine & Beverages */}
          <div className="bg-secondary text-white rounded-2xl p-8 md:p-12 mb-20">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-serif font-bold mb-6">
                Wine & Beverage Selection
              </h2>
              <p className="text-gray-200 text-lg mb-8">
                Our curated wine list features selections from France, Italy, South Africa, 
                and local Guinean wines. Our sommelier is available to help you choose the 
                perfect pairing for your meal.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-10">
                <div>
                  <div className="text-4xl mb-4">🇫🇷</div>
                  <h4 className="text-xl font-semibold mb-2">French Wines</h4>
                  <p className="text-gray-300">Bordeaux, Burgundy, Champagne</p>
                </div>
                <div>
                  <div className="text-4xl mb-4">🇮🇹</div>
                  <h4 className="text-xl font-semibold mb-2">Italian Wines</h4>
                  <p className="text-gray-300">Chianti, Barolo, Prosecco</p>
                </div>
                <div>
                  <div className="text-4xl mb-4">🌍</div>
                  <h4 className="text-xl font-semibold mb-2">Local & African</h4>
                  <p className="text-gray-300">Guinean selections & African wines</p>
                </div>
              </div>
            </div>
          </div>

          {/* Private Dining */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="h-80 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center">
                <div className="text-center text-gray-700 p-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold mb-2">Private Dining</h3>
                  <p className="text-sm">TODO: Replace with private dining photos</p>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6">
                  Private Dining & Events
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Host your special occasions in our private dining room, accommodating 
                  up to 30 guests. Perfect for birthdays, anniversaries, and business dinners.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    <span className="text-gray-700">Customized menu options</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    <span className="text-gray-700">Dedicated service staff</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    <span className="text-gray-700">Audio-visual equipment available</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 bg-primary rounded-full mr-3"></span>
                    <span className="text-gray-700">Wine pairing recommendations</span>
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="inline-flex items-center bg-primary hover:bg-amber-600 text-white px-6 py-3.5 rounded-full font-semibold transition-colors"
                >
                  Inquire About Private Dining
                </Link>
              </div>
            </div>
          </div>

          {/* Reservation CTA */}
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-serif font-bold mb-6">
              Reserve Your Table
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Experience fine dining at {restaurant.name}. Book your table in advance 
              to ensure availability, especially for weekend evenings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/reservation"
                className="bg-white text-secondary hover:bg-gray-100 px-8 py-3.5 rounded-full font-semibold transition-colors"
              >
                Book a Table
              </Link>
              <Link
                href="/contact"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-3.5 rounded-full font-semibold transition-colors"
              >
                Contact Restaurant
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-flex items-center text-primary hover:text-amber-600 font-semibold text-lg"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}