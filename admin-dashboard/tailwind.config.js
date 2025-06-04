/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          500: '#4ecdc4',
          600: '#44a08d',
          700: '#2c3e50',
        },
        findthem: {
          bg: '#3D8D7F',  
          light: '#D8EBD3', 
          button: '#1C4B43', 
          teal:'#3D8D7F',  
          lightteal:   '#7AC9BCFF'    ,
          darkGreen:  '#1C4B43', 
                    lightbg:   '#FFFFFFFF'    ,


        }
      }
    },
  },
  plugins: [],
}