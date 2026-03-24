/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/context/**/*.{js,ts,jsx,tsx}"
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
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Primary colors with opacity variants
        primary: {
          DEFAULT: "var(--primary-accent)",
          dark: {
            DEFAULT: "var(--primary-dark)",
            50: "rgb(var(--primary-dark) / 0.5)",
            95: "rgb(var(--primary-dark) / 0.95)",
          },
          light: "var(--primary-light)",
          foreground: "var(--foreground)",
        },

        // Accent colors
        accent: {
          DEFAULT: "var(--primary-accent)",
          light: "var(--accent-light)",
          foreground: "var(--foreground)",
        },

        // Card colors
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },

        // Destructive colors
        destructive: {
          DEFAULT: "hsl(0 84.2% 60.2%)",
          foreground: "hsl(0 0% 98%)",
        },

        // Muted colors
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },

        // Popover colors
        popover: {
          DEFAULT: "var(--card)",
          foreground: "var(--foreground)",
        },

        // Custom colors
        'dark-bg': "var(--dark-bg)",
        'light-bg': "var(--light-bg)",
        'custom-blue': "#222831",
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
          50%: { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};