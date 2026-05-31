export const THEME_STORAGE_KEY = 'roomify.theme';

export const DEFAULT_THEME_ID = 'roomify-premium';

export const ROOMIFY_THEMES = [
  {
    id: 'roomify-premium',
    name: 'Roomify Premium',
    description: 'The current premium hotel-tech look with teal energy, warm gold, and soft cream surfaces.',
    preview: ['#061622', '#12B3A8', '#D6A84F', '#F6F0E4'],
  },
  {
    id: 'roomify-classic',
    name: 'Roomify Classic',
    description: 'A calmer original-style palette with blue operations tones and understated surfaces.',
    preview: ['#1A2B3A', '#35658D', '#D4A24C', '#F5F2EA'],
  },
  {
    id: 'midnight-emerald',
    name: 'Midnight Emerald',
    description: 'A darker executive console with emerald glow, deep navy depth, and crisp contrast.',
    preview: ['#03111C', '#00C48C', '#49F0C0', '#EAF7F1'],
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    description: 'A luxury hotel mood with midnight blue, champagne gold, and polished cream surfaces.',
    preview: ['#071A3A', '#D9A441', '#F6DCA2', '#FAF0DD'],
  },
  {
    id: 'aurora-violet',
    name: 'Aurora Violet',
    description: 'A futuristic SaaS palette with violet depth, cyan sparks, and aurora gradients.',
    preview: ['#150A32', '#7C3AED', '#22D3EE', '#F4EEFF'],
  },
  {
    id: 'ocean-sapphire',
    name: 'Ocean Sapphire',
    description: 'A polished coastal palette with sapphire depth, aqua highlights, and crisp resort surfaces.',
    preview: ['#06213E', '#1677FF', '#20D3C2', '#EEF7FF'],
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    description: 'A warm boutique-hotel palette with coral energy, amber light, and soft ivory surfaces.',
    preview: ['#2D1726', '#F25F5C', '#FFB454', '#FFF3E8'],
  },
  {
    id: 'alpine-mint',
    name: 'Alpine Mint',
    description: 'A fresh spa-inspired look with forest depth, mint accents, and calm airy surfaces.',
    preview: ['#083326', '#28C997', '#B8F3D4', '#F0FBF5'],
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    description: 'A refined lifestyle palette with plum contrast, rose accents, and soft pearl backgrounds.',
    preview: ['#321225', '#D9467C', '#F9A8D4', '#FFF1F7'],
  },
  {
    id: 'graphite-copper',
    name: 'Graphite Copper',
    description: 'A dramatic executive palette with graphite surfaces, copper accents, and premium warmth.',
    preview: ['#14171F', '#C46A3A', '#F3B179', '#F5F1EA'],
  },
];

export const getThemeById = (themeId) =>
  ROOMIFY_THEMES.find((theme) => theme.id === themeId) ?? ROOMIFY_THEMES[0];

export const isKnownThemeId = (themeId) =>
  ROOMIFY_THEMES.some((theme) => theme.id === themeId);
