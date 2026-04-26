export interface MenuItem {
  name: string
  description: string
  price: string
  badge?: 'populaire' | 'recommande' | 'specialite'
}

export interface MenuCategory {
  category: string
  icon: string
  items: MenuItem[]
}

export const restaurantMenu: MenuCategory[] = [
  {
    category: 'Petit déjeuner',
    icon: '',
    items: [
      {
        name: 'Petit déjeuner buffet',
        description: 'Assortiment de viennoiseries, fruits frais, œufs, fromage et charcuterie',
        price: '150 000 GNF',
        badge: 'populaire',
      },
      {
        name: 'Formule Djamiyah',
        description: 'Plat chaud au choix, boissons chaudes, jus de fruits et desserts',
        price: '200 000 GNF',
        badge: 'specialite',
      },
    ],
  },
  {
    category: 'Entrées & Salades',
    icon: '',
    items: [
      {
        name: 'Salade composee',
        description: 'Laitue romaine, tomates, concombres, olives et vinaigrette maison',
        price: '80 000 GNF',
      },
      {
        name: 'Salade Caesar',
        description: 'Poulet grille, parmesan, croûtons et sauce Caesar',
        price: '120 000 GNF',
        badge: 'recommande',
      },
      {
        name: 'Soupe de legumes',
        description: 'Veloute de saison aux herbes fraiches',
        price: '60 000 GNF',
      },
    ],
  },
  {
    category: 'Grillades & Brochettes',
    icon: '',
    items: [
      {
        name: 'Mixtes grillés',
        description: 'Assortiment de viandes grillees (bœuf, mouton, poulet) avec sauces',
        price: '250 000 GNF',
        badge: 'populaire',
      },
      {
        name: 'Brochettes de bœuf',
        description: 'Bœuf mariné aux epices africaines, riz et salad',
        price: '180 000 GNF',
        badge: 'specialite',
      },
      {
        name: 'Commando',
        description: 'Brochette de foie et rognons grilles, sauce piquante',
        price: '120 000 GNF',
      },
    ],
  },
  {
    category: 'Volailles',
    icon: '',
    items: [
      {
        name: 'Poulet du pays',
        description: 'Poulet local roti aux epices traditionnelles, frites et salad',
        price: '200 000 GNF',
        badge: 'specialite',
      },
      {
        name: 'Poulet maman',
        description: 'Demi-poulet grille au bbq, accompagne de plantains et salade',
        price: '220 000 GNF',
        badge: 'populaire',
      },
      {
        name: 'Ailes de poulet',
        description: 'Ailes grillees sauce barbecue ou sauce piquante',
        price: '150 000 GNF',
      },
    ],
  },
  {
    category: 'Poissons & Fruits de mer',
    icon: '',
    items: [
      {
        name: 'Filet de capitaine',
        description: 'Poisson frais grille ou fume, legumes et riz',
        price: '350 000 GNF',
        badge: 'specialite',
      },
      {
        name: 'Dorado braise',
        description: 'Dorado entier grille aux epices, accompaniments au choix',
        price: '400 000 GNF',
        badge: 'recommande',
      },
      {
        name: 'Gambas',
        description: 'Crevettes geantes grillees, ail et persillade',
        price: '380 000 GNF',
        badge: 'populaire',
      },
      {
        name: 'Calamar',
        description: 'Calamars grilles ou frits, sauce tartare',
        price: '280 000 GNF',
      },
      {
        name: 'Crevettes',
        description: 'Crevettes sautees au coco ou a la creole',
        price: '250 000 GNF',
      },
    ],
  },
  {
    category: 'Pates & Gratins',
    icon: '',
    items: [
      {
        name: 'Spaghetti napolitain',
        description: 'Pates italiennes a la sauce tomate et parmesan',
        price: '120 000 GNF',
      },
      {
        name: 'Spaghetti bolognaise',
        description: 'Pates italiennes a la sauce boloignaise maison',
        price: '150 000 GNF',
        badge: 'recommande',
      },
    ],
  },
  {
    category: 'Pizzas',
    icon: '',
    items: [
      {
        name: 'Pizza Margarita',
        description: 'Sauce tomate, mozzarella et basilic frais',
        price: '100 000 GNF',
      },
      {
        name: 'Pizza au thon',
        description: 'Sauce tomate, thon, olives et mozzarella',
        price: '140 000 GNF',
        badge: 'populaire',
      },
      {
        name: 'Pizza Djamiyah',
        description: 'Sauce tomate, poulet, champignons et sauce blanche',
        price: '160 000 GNF',
        badge: 'specialite',
      },
      {
        name: 'Pizza fruits de mer',
        description: 'Sauce tomate, assortiment de fruits de mer et mozzarella',
        price: '200 000 GNF',
      },
    ],
  },
  {
    category: 'Garnitures',
    icon: '',
    items: [
      { name: 'Riz blanc', description: 'Riz parfume cooks a la vapeur', price: '30 000 GNF' },
      { name: 'Frites', description: 'Frites croustillantes maison', price: '35 000 GNF' },
      { name: 'Plantains', description: 'Plantains frits ou douce', price: '35 000 GNF' },
      { name: 'Haricots', description: 'Haricots rouges ou blancs cooks', price: '30 000 GNF' },
      {
        name: 'Pomme de terre sautees',
        description: 'Pommes de terre sautées aux herbes',
        price: '35 000 GNF',
      },
    ],
  },
]

export const beverages = [
  { name: 'Eau minérale', price: '15 000 GNF' },
  { name: 'Jus naturels (ananas, gingembre, baobab)', price: '25 000 GNF' },
  { name: 'Sodas', price: '15 000 GNF' },
  { name: 'Café / Thé', price: '10 000 GNF' },
  { name: 'Bière locale (SOS)', price: '15 000 GNF' },
  { name: 'Bière importée', price: '25 000 GNF' },
  { name: 'Vin rouge / Vin blanc', price: '80 000 GNF' },
]
