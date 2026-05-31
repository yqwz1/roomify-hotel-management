import tailwindcssAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
      fontFamily: {
        // Thmanyah Sans — body, UI, dashboards, forms (Latin + Arabic in one file)
        sans: ['"Thmanyah Sans"', 'sans-serif'],
        // Thmanyah Serif Display — hero headlines, editorial display moments
        serif: ['"Thmanyah Serif Display"', 'serif'],
        // Thmanyah Serif Text — long-form body in editorial sections
        'serif-text': ['"Thmanyah Serif Text"', 'serif'],
        // Alias for legacy .font-heading usage (Footer brand, status titles)
        heading: ['"Thmanyah Serif Display"', 'serif'],
      },
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// ── Roomify brand tokens ──────────────────────────────────
  			// Source of truth for product UI colors. Prefer these over inline hex.
  			brand: {
  				// Core
  				primary: '#12B3A8',
  				'primary-deep': '#073B4C',
  				'primary-hover': '#0F8F8A',
  				'primary-tint': '#D7F7F1',
  				'primary-fg': '#FFFFFF',
  				midnight: '#061622',
  				ocean: '#0B2E3F',
  				lagoon: '#0E7C7B',
  				champagne: '#F8E7BD',
  				gold: '#D6A84F',
  				coral: '#E86F5C',
  				// Surfaces
  				surface: '#F6F0E4',
  				'surface-light': '#FFF9EE',
  				card: '#FFFFFF',
  				'surface-border': '#E6D9C1',
  				// Text
  				ink: '#071A25',
  				'ink-muted': '#526678',
  				'ink-hint': '#8A9AAB',
  				// Status
  				success: '#10A66E',
  				warning: '#C9891B',
  				danger: '#C74343',
  				// Accents — use sparingly
  				'accent-gold': '#D6A84F',
  				'accent-terracotta': '#E86F5C',
  			}
  		},
  		ringColor: {
  			'brand-focus': 'rgba(18,179,168,0.28)',
  		},
  		boxShadow: {
  			'brand-cta': '0 18px 42px -14px rgba(18,179,168,0.62)',
  			'brand-cta-hover': '0 24px 54px -16px rgba(7,59,76,0.7)',
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
}
