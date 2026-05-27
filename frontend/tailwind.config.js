/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores Oficiales UNAM
        unam: {
          azul: "#002B7A", // Azul Marino Puma
          oro: "#CDB170", // Oro/Amarillo Puma
          "oro-light": "#F1E9D7", // Fondo suave para el cuadro de credenciales
        },
      },
    },
  },
  plugins: [],
};
