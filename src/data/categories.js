export const navCategories = [
  { label: 'Ver todo', icon: '/icons/all.svg' },
  { label: 'Accesorios', icon: '/icons/accesories.svg' },
  { label: 'TCG', icon: '/icons/cards.svg' },
  { label: 'Figuras y peluches', icon: '/icons/figures.svg' },
  { label: 'Juegos de mesa', icon: '/icons/meeple.svg' },
  { label: 'Videojuegos', icon: '/icons/videogame.svg' },
  { label: 'Ropa', icon: '/icons/clothes.svg' },
]

export const interestCategories = [
  'Accesorios',
  'Cartas',
  'Figuras y peluches',
  'Juegos de mesa',
  'Ropa',
  'Videojuegos',
  'Series',
]

export const sellerCategories = [
  {
    label: 'Accesorios',
    subcategories: [
      { label: 'Aretes' },
      { label: 'Collares' },
      { label: 'Llaveros' },
      { label: 'Stickers' },
      { label: 'Pines' },
      { label: 'Pulseras' },
      {
        label: 'Varios',
        subcategories: [
          { label: 'Cinturones' },
          { label: 'Bolsas' },
          { label: 'Cartera' },
          { label: 'Mochila' },
        ],
      },
    ],
  },
  {
    label: 'Ropa',
    subcategories: [
      { label: 'Gorros y cachuchas' },
      { label: 'Playeras y blusas' },
      { label: 'Chaqueta, Chamarras, Sueter' },
      { label: 'Calcetines' },
      { label: 'Calzado' },
      { label: 'Conjunto, Disfraz, Traje' },
      {
        label: 'Varios',
        subcategories: [
          { label: 'Ropa interior' },
          { label: 'Pijamas' },
          { label: 'Pantalones' },
          { label: 'Vestidos y faldas' },
        ],
      },
    ],
  },
  {
    label: 'Figuras y peluches',
    subcategories: [{ label: 'Figuras' }, { label: 'Modelos' }, { label: 'Peluches' }],
  },
  {
    label: 'Juegos',
    subcategories: [{ label: 'Juegos de mesa' }, { label: 'Accesorios' }],
  },
  {
    label: 'TCG',
  },
  {
    label: 'Videojuegos',
    subcategories: [{ label: 'Videojuegos' }, { label: 'Consola' }, { label: 'Accesorios' }],
  },
]