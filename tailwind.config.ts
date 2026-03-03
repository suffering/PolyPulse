import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	// 8px grid system (1 unit = 8px = 0.5rem)
  	spacing: {
  		'0': '0px',
  		'1': '0.5rem',    // 8px
  		'2': '1rem',      // 16px
  		'3': '1.5rem',    // 24px
  		'4': '2rem',      // 32px
  		'5': '2.5rem',    // 40px
  		'6': '3rem',      // 48px
  		'7': '3.5rem',    // 56px
  		'8': '4rem',      // 64px
  		'9': '4.5rem',    // 72px
  		'10': '5rem',     // 80px
  		'11': '5.5rem',   // 88px
  		'12': '6rem',     // 96px
  		'14': '7rem',     // 112px
  		'16': '8rem',     // 128px
  		'20': '10rem',    // 160px
  		'24': '12rem',    // 192px
  		'28': '14rem',    // 224px
  		'32': '16rem',    // 256px
  		'36': '18rem',    // 288px
  		'40': '20rem',    // 320px
  		'44': '22rem',    // 352px
  		'48': '24rem',    // 384px
  		'52': '26rem',    // 416px
  		'56': '28rem',    // 448px
  		'60': '30rem',    // 480px
  		'64': '32rem',    // 512px
  		'72': '36rem',    // 576px
  		'80': '40rem',    // 640px
  		'96': '48rem',    // 768px
  		'px': '1px',
  		'0.5': '0.25rem', // 4px (half-step for fine adjustments)
  	},
  	extend: {
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
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
