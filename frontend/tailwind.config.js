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
  				primary: '#35658D',
  				'primary-deep': '#264B6B',
  				'primary-hover': '#4A7BA6',
  				'primary-tint': '#D9E3EE',
  				'primary-fg': '#FFFFFF',
  				// Surfaces
  				surface: '#F5F2EA',
  				'surface-light': '#FBF9F4',
  				card: '#FFFFFF',
  				'surface-border': '#E8E3D6',
  				// Text
  				ink: '#1A2B3A',
  				'ink-muted': '#5C6B7A',
  				'ink-hint': '#8A95A1',
  				// Status
  				success: '#1D9E75',
  				warning: '#BA7517',
  				danger: '#A32D2D',
  				// Accents — use sparingly
  				'accent-gold': '#D4A24C',
  				'accent-terracotta': '#C97757',
  			}
  		},
  		ringColor: {
  			'brand-focus': 'rgba(53,101,141,0.25)',
  		},
  		boxShadow: {
  			'brand-cta': '0 14px 32px -10px rgba(53,101,141,0.55)',
  			'brand-cta-hover': '0 18px 40px -12px rgba(38,75,107,0.65)',
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
}
