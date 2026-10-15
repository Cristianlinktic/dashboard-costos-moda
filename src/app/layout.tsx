import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import { MarthaProvider } from "@/lib/datos/MarthaProvider";
import { Shell } from "@/components/Shell";
import { escalas } from "@/design/tokens";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Martha · Costos y márgenes", template: "%s · Martha" },
  description: "Calcula el costo real, el landed cost y el margen de cada producto de tu ecommerce.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { color: escalas.bruma[50] },
  ],
};

// Aplica el tema antes de pintar para evitar el parpadeo claro → oscuro.
// Claro por defecto; solo cambia a oscuro si la persona lo eligió.
const scriptTema = `(function(){try{document.documentElement.dataset.tema=localStorage.getItem('martha-tema')==='oscuro'?'oscuro':'claro'}catch(e){document.documentElement.dataset.tema='claro'}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" data-tema="claro" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="antialiased">
        <MarthaProvider>
          <Shell>{children}</Shell>
        </MarthaProvider>
      </body>
    </html>
  );
}
