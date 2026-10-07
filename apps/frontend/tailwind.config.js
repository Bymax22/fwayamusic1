/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "var(--gap-md)",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Semantic colors mapped to CSS variables
        purple: "rgba(var(--primary-accent), <alpha-value>)",
        charcoal: "rgba(var(--card), <alpha-value>)",
        border: "rgba(var(--border), <alpha-value>)",
        input: "rgba(var(--input), <alpha-value>)",
        ring: "rgba(var(--ring), <alpha-value>)",
        background: "rgba(var(--background), <alpha-value>)",
        foreground: "rgba(var(--foreground), <alpha-value>)",
        
        // Primary colors with opacity variants
        primary: {
          DEFAULT: "rgba(var(--primary-accent), <alpha-value>)",
          dark: {
            DEFAULT: "rgba(var(--primary-dark), <alpha-value>)",
            50: "rgba(var(--primary-dark), 0.5)",
            95: "rgba(var(--primary-dark), 0.95)",
          },
          light: "rgba(var(--primary-light), <alpha-value>)",
          foreground: "rgba(var(--foreground), 1)",
        },
        
        // Accent colors
        accent: {
          DEFAULT: "rgba(var(--primary-accent), <alpha-value>)",
          light: "rgba(var(--accent-light), <alpha-value>)",
          foreground: "rgba(var(--foreground), 1)",
        },
        
        // Card colors
        card: {
          DEFAULT: "rgba(var(--card), <alpha-value>)",
          foreground: "rgba(var(--card-foreground), 1)",
        },
        
        // Destructive colors
        destructive: {
          DEFAULT: "rgba(var(--primary-accent), <alpha-value>)",
          foreground: "rgba(var(--foreground), 1)",
        },
        
        // Muted colors
        muted: {
          DEFAULT: "rgba(var(--muted), <alpha-value>)",
          foreground: "rgba(var(--muted-foreground), 1)",
        },
        
        // Popover colors
        popover: {
          DEFAULT: "rgba(var(--card), <alpha-value>)",
          foreground: "rgba(var(--foreground), 1)",
        },
        
        // Custom colors
        'dark-bg': "rgba(var(--dark-bg), <alpha-value>)",
        'light-bg': "rgba(var(--light-bg), <alpha-value>)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "9999px",
      },
      spacing: {
        navbar: "var(--navbar-height)",
        sidebar: "var(--sidebar-width)",
        'sidebar-collapsed': "var(--sidebar-collapsed)",
        player: "var(--player-height)",
        sm: "var(--gap-sm)",
        md: "var(--gap-md)",
        lg: "var(--gap-lg)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["Inter", "Ubuntu", "sans-serif"],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      addUtilities({
        '.content-area': {
          'padding-left': 'var(--sidebar-width)',
          'padding-top': 'var(--navbar-height)',
        },
        '.sidebar-collapsed .content-area': {
          'padding-left': 'var(--sidebar-collapsed)',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.glass-morphism': {
          'background-color': 'rgba(var(--primary-dark-darker), 0.3)',
          'backdrop-filter': 'blur(16px)',
          'border': '1px solid rgba(var(--primary-accent), 0.15)',
          'box-shadow': '0 8px 32px rgba(var(--primary-dark), 0.2)',
        },
        '.text-gradient': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          'color': 'transparent',
          'background-image': 'linear-gradient(135deg, rgb(var(--primary-accent)), rgb(var(--primary-dark)))',
        },
      });
    },
  ],
};