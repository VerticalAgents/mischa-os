
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
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
			colors: {
				/* chao da aplicacao: meio tom abaixo do bloco (ver DESIGN.md secao 2) */
				ground: 'hsl(var(--app-ground))',
				/* escalas em hex: aceitam opacidade (/10, /12, /25) */
				brand: {
					50: '#e8fbf2', 100: '#c7f5e0', 200: '#93ecc4', 300: '#57e2a5', 400: '#25d98d',
					500: '#16bd79', 600: '#0f9d64', 700: '#0b7d50', 800: '#097046', 900: '#006239',
				},
				/* laranja = acao irreversivel. Nao decorativo, nao entra em grafico nem badge. */
				acao: {
					50: '#fff4f0', 100: '#ffe4da', 200: '#ffb89e', 300: '#ff9873', 400: '#ff7a52',
					500: '#ff5524', 600: '#e04415', 700: '#b8350f', 800: '#8f2a0c', 900: '#6b2009',
				},
				neutro: {
					50: '#fdfdfd', 100: '#f6f6f6', 200: '#ededed', 300: '#dfdfdf', 400: '#c4c4c4',
					500: '#909090', 600: '#707070', 700: '#525252', 800: '#3a3a3a', 900: '#202020', 950: '#171717',
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
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
					foreground: 'hsl(var(--card-foreground))'
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
			borderRadius: {
				/* Bloco = 28px, Controle = 8px. NUNCA o mesmo raio para os dois. */
				bloco: '28px',
				/* Marcacao de "voce esta aqui": item aceso do menu, aba ativa, item da
				   barra inferior. O valor vem da secao 8 do DESIGN.md, onde o item da
				   barra do celular e rounded-[22px]. Nao e um terceiro raio solto — e
				   a mesma pilula, usada em todo lugar que diz onde voce esta. */
				pilula: '22px',
				controle: 'var(--radius)',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				tema: '0 1px 3px 0 rgb(0 0 0 / 0.17)',
				'tema-md': '0 2px 6px -1px rgb(0 0 0 / 0.17), 0 1px 3px -1px rgb(0 0 0 / 0.12)',
				bloco: '0 1px 3px 0 rgb(0 0 0 / 0.14), 0 12px 28px -12px rgb(0 0 0 / 0.22)',
				glow: '0 0 30px rgb(37 217 141 / 0.28)',
				'glow-sm': '0 0 20px rgb(37 217 141 / 0.14)',
			},
			letterSpacing: { tema: 'var(--letter-spacing)' },
			transitionTimingFunction: {
				'out-expo': 'cubic-bezier(.16, 1, .3, 1)',
				'out-quart': 'cubic-bezier(.25, 1, .5, 1)',
				mola: 'cubic-bezier(.34, 1.56, .64, 1)',
			},
			transitionDuration: { press: '80ms' },
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
        'fade-in': {
          from: { opacity: 0, transform: "translateY(5px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        'fade-out': {
          from: { opacity: 1, transform: "translateY(0)" },
          to: { opacity: 0, transform: "translateY(5px)" },
        }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
