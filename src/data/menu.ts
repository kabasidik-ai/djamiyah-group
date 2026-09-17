// ============================================================
// MENU STRUCTURÉ — HÔTEL MAISON BLANCHE (COYAH) UNIQUEMENT
// Ce menu (restaurantMenu, beverages) est la carte fixe de
// l'Hôtel Maison Blanche. Il ne doit JAMAIS être affiché sur
// l'Hôtel Rama.
//
// Hôtel Rama (Kissidougou) : PAS de menu fixe — menu du jour
// selon disponibilité (config dans src/data/hotels.ts, champ
// `restaurant`, menuType 'variable').
// ============================================================

export interface MenuItem {
  name: string
  description?: string
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
        name: 'Buffet Classique',
        description: 'Beurre, confiture, œuf, croissant, jus, café / thé / café au lait',
        price: '75 000 GNF',
      },
      {
        name: 'Buffet La Maison',
        description:
          'Beurre, confiture, pancake / crêpe, œuf, croissant, jus, café / thé / café au lait',
        price: '95 000 GNF',
      },
      {
        name: 'Buffet Djamiyah',
        description:
          'Beurre, confiture, pancake / crêpe, œuf, croissant, jus, café / thé / café au lait, assiette de corned-beef, assiette de fromage',
        price: '120 000 GNF',
      },
    ],
  },
  {
    category: 'Entrées froides',
    icon: '',
    items: [
      {
        name: 'Salade mixte',
        description: 'Laitue, tomate, carotte, concombre, œuf, échalote',
        price: '65 000 GNF',
      },
      {
        name: 'Salade César',
        description: 'Laitue, croûton, poulet, olive, parmesan, vinaigrette',
        price: '100 000 GNF',
      },
      {
        name: 'Salade de crevettes',
        description: 'Laitue, croûton, carotte, concombre, crevette, échalote, olive',
        price: '100 000 GNF',
      },
    ],
  },
  {
    category: 'Entrées chaudes',
    icon: '',
    items: [
      {
        name: 'Soupe de légumes',
        description: 'Soupe de légumes de saison',
        price: '100 000 GNF',
      },
    ],
  },
  {
    category: 'Mixtes grillés & Brochettes',
    icon: '',
    items: [
      { name: 'Mixte grillé (viande & poulet)', price: '120 000 GNF' },
      { name: 'Mixte grillé fruits de mer', price: '150 000 GNF' },
      { name: 'Brochette de bœuf', price: '130 000 GNF' },
      { name: 'Brochette de poisson', price: '130 000 GNF' },
      { name: 'Brochette de gambas', price: '140 000 GNF' },
    ],
  },
  {
    category: 'Poissons',
    icon: '',
    items: [
      { name: 'Filet de poisson', price: '65 000 GNF' },
      { name: 'Poisson braisé', price: '100 000 GNF' },
      { name: 'Poisson frit', price: '100 000 GNF' },
    ],
  },
  {
    category: 'Volailles',
    icon: '',
    items: [
      { name: 'Poulet du pays', price: '130 000 GNF' },
      { name: 'Poulet maman', price: '100 000 GNF' },
      { name: 'Ailes de poulet', price: '100 000 GNF' },
      { name: 'Pilons de poulet', price: '100 000 GNF' },
      { name: 'Cuisses de poulet', price: '100 000 GNF' },
    ],
  },
  {
    category: 'Fruits de mer',
    icon: '',
    items: [
      { name: 'Calamar', price: '100 000 GNF' },
      { name: 'Crevettes', price: '150 000 GNF' },
      { name: 'Gambas', price: '150 000 GNF' },
      { name: 'Commando', price: '180 000 GNF' },
    ],
  },
  {
    category: 'Garnitures',
    icon: '',
    items: [
      { name: 'Attiéké', price: '50 000 GNF' },
      { name: 'Alloco', price: '50 000 GNF' },
      { name: 'Petits pois', price: '50 000 GNF' },
      { name: 'Haricot blanc', price: '50 000 GNF' },
      { name: 'Riz blanc', price: '50 000 GNF' },
      { name: 'Frites', price: '50 000 GNF' },
      { name: 'Pâtes', price: '50 000 GNF' },
      { name: 'Couscous', price: '50 000 GNF' },
    ],
  },
  {
    category: 'Pâtes',
    icon: '',
    items: [
      { name: 'Spaghetti bolognaise', price: '100 000 GNF' },
      { name: 'Spaghetti sauce blanche au poulet', price: '100 000 GNF' },
      { name: 'Spaghetti aux fruits de mer', price: '130 000 GNF' },
    ],
  },
  {
    category: 'Pizzas',
    icon: '',
    items: [
      {
        name: 'Pizza Margherita',
        description: 'Sauce tomate, fromage, mozzarella',
        price: '80 000 GNF',
      },
      {
        name: 'Pizza au thon',
        description: 'Sauce tomate, thon, échalote, fromage, mozzarella, poivron, olive',
        price: '90 000 GNF',
      },
      {
        name: 'Pizza poulet',
        description: 'Sauce tomate, poulet, poivron, tomate, échalote, fromage, mozzarella, olive',
        price: '100 000 GNF',
      },
      {
        name: 'Pizza viande',
        description: 'Sauce tomate, poulet, poivron, tomate, échalote, fromage, mozzarella, olive',
        price: '100 000 GNF',
      },
      {
        name: 'Pizza fruits de mer',
        description:
          'Sauce tomate, crevette, calamar, fromage, mozzarella, échalote, tomate, poivron, olive',
        price: '120 000 GNF',
      },
    ],
  },
  {
    category: 'Sandwiches',
    icon: '',
    items: [
      { name: 'Chawarma poulet', price: '70 000 GNF' },
      { name: 'Chawarma viande', price: '100 000 GNF' },
    ],
  },
  {
    category: 'Desserts',
    icon: '',
    items: [
      { name: 'Flan', price: 'Prix sur place / sur demande' },
      { name: 'Cake', price: 'Prix sur place / sur demande' },
      { name: 'Fruit de saison', price: 'Prix sur place / sur demande' },
      { name: 'Yaourt', price: 'Prix sur place / sur demande' },
    ],
  },
]

export const beverages = [
  { name: 'NESPRESSO', price: '20 000 GNF' },
  { name: 'NESCAFÉ', price: '20 000 GNF' },
  { name: 'Thé', price: '20 000 GNF' },
  { name: 'Café au lait', price: '35 000 GNF' },
  { name: 'Café au lait simple', price: '15 000 GNF' },
]
