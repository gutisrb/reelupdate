import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			/* 8pt spatial system */
			spacing: {
				'1': '4px',
				'2': '8px',
				'3': '12px', 
				'4': '16px',
				'5': '20px',
				'6': '24px',
				'7': '28px',
				'8': '32px',
				'9': '36px',
				'10': '40px',
				'12': '48px',
				'16': '64px',
				'20': '80px',
				'24': '96px',
				'32': '128px',
			},
			maxWidth: {
				'7xl': '1280px',
			},
			fontFamily: {
				'inter': ['Inter', 'sans-serif'],
			},
			fontSize: {
				'heading-1': ['44px', { lineHeight: '48px', letterSpacing: '-0.01em', fontWeight: '700' }],
				'heading-2': ['32px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '600' }],
				'heading-3': ['24px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
				'body': ['18px', { lineHeight: '28px', letterSpacing: '-0.002em', fontWeight: '400' }],
				'body-sm': ['16px', { lineHeight: '24px', letterSpacing: '-0.002em', fontWeight: '400' }],
				"text-13": "var(--text-13)",
				"text-16": "var(--text-16)", 
				"text-24": "var(--text-24)",
				"text-44": "var(--text-44)",
				"13": "0.8125rem",
			},
			colors: {
				border: 'hsl(var(--border))',
				'border-subtle': 'hsl(var(--border-subtle))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				'surface-calm': 'hsl(var(--surface-calm))',
				surface: 'hsl(var(--surface-calm))',
				foreground: 'hsl(var(--foreground))',
				'text-primary': 'hsl(var(--text-primary))',
				'text-muted': 'hsl(var(--text-muted))',
				'text-subtle': 'hsl(var(--text-subtle))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					glow: 'hsl(var(--primary-glow))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					glow: 'hsl(var(--card-glow))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-card': 'var(--gradient-card)',
			},
			borderRadius: {
				'2xl': '1rem',
				'xl': '12px',
				lg: 'calc(var(--radius) - 4px)',
				md: 'calc(var(--radius) - 8px)',
				sm: 'calc(var(--radius) - 12px)',
				input: 'var(--input-radius)',
				pill: 'var(--pill-radius)'
			},
			keyframes: {
				/* Accordion animations */
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},

				/* Entrance animations - 180ms ease-out */
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},

				/* Hover micro-interactions - 80ms */
				'lift': {
					'0%': { transform: 'scale(1) translateY(0)' },
					'100%': { transform: 'scale(1.01) translateY(-1px)' }
				},

				/* Background gradient animation */
				'gradient': {
					'0%, 100%': { opacity: '0.2', transform: 'scale(1) rotate(0deg)' },
					'50%': { opacity: '0.3', transform: 'scale(1.1) rotate(180deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 180ms cubic-bezier(0, 0, 0.2, 1)',
				'scale-in': 'scale-in 180ms cubic-bezier(0, 0, 0.2, 1)',
				'lift': 'lift 80ms cubic-bezier(0.4, 0, 0.2, 1)',
				'gradient': 'gradient 8s ease-in-out infinite',
			},
			transitionDuration: {
				'80': '80ms',
				'150': '150ms', 
				'180': '180ms',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
