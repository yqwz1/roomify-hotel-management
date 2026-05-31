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
  				// Core tokens are CSS variables so Settings themes recolor the app globally.
  				primary: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
  				'primary-deep': 'rgb(var(--brand-primary-deep-rgb) / <alpha-value>)',
  				'primary-hover': 'rgb(var(--brand-primary-hover-rgb) / <alpha-value>)',
  				'primary-tint': 'rgb(var(--brand-primary-tint-rgb) / <alpha-value>)',
  				'primary-fg': '#FFFFFF',
  				midnight: 'rgb(var(--brand-midnight-rgb) / <alpha-value>)',
  				ocean: 'rgb(var(--brand-ocean-rgb) / <alpha-value>)',
  				lagoon: 'rgb(var(--brand-lagoon-rgb) / <alpha-value>)',
  				champagne: 'rgb(var(--brand-champagne-rgb) / <alpha-value>)',
  				gold: 'rgb(var(--brand-gold-rgb) / <alpha-value>)',
  				coral: 'rgb(var(--brand-coral-rgb) / <alpha-value>)',
  				// Surfaces
  				surface: 'rgb(var(--brand-surface-rgb) / <alpha-value>)',
  				'surface-light': 'rgb(var(--brand-surface-light-rgb) / <alpha-value>)',
  				card: 'rgb(var(--brand-card-rgb) / <alpha-value>)',
  				'surface-border': 'rgb(var(--brand-surface-border-rgb) / <alpha-value>)',
  				// Text
  				ink: 'rgb(var(--brand-ink-rgb) / <alpha-value>)',
  				'ink-muted': 'rgb(var(--brand-ink-muted-rgb) / <alpha-value>)',
  				'ink-hint': 'rgb(var(--brand-ink-hint-rgb) / <alpha-value>)',
  				// Status
  				success: '#10A66E',
  				warning: '#C9891B',
  				danger: '#C74343',
  				// Accents — use sparingly
  				'accent-gold': 'rgb(var(--brand-gold-rgb) / <alpha-value>)',
  				'accent-terracotta': 'rgb(var(--brand-coral-rgb) / <alpha-value>)',
  			}
  		},
  		ringColor: {
  			'brand-focus': 'rgb(var(--brand-primary-rgb) / 0.28)',
  		},
  		boxShadow: {
  			'brand-cta': '0 18px 42px -14px rgba(18,179,168,0.62)',
  			'brand-cta-hover': '0 24px 54px -16px rgba(7,59,76,0.7)',
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
}
