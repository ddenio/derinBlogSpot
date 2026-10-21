import type { Metadata, Viewport } from "next";
import { Roboto, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "next-themes";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { EdgeStoreProvider } from "@/lib/edgestore";
import { Toaster } from "react-hot-toast";
import { SocketContextProvider } from "@/context/SocketContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Derin's Blog Spot",
  description: "Your favorite Web Dev Blogs!",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <EdgeStoreProvider>
      <SessionProvider session={session}>
        <SocketContextProvider>
          <html
            lang="en"
            suppressHydrationWarning
            className={cn("font-sans", inter.variable)}
          >
            <body
              className={cn(
                "antialiased flex flex-col min-h-screen px-2",
                roboto.variable,
              )}
            >
              <Toaster
                position="bottom-center"
                toastOptions={{
                  style: {
                    background: "rgb(51 65 85)",
                    color: "#fff",
                  },
                }}
              />
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <NavBar />
                <main className="flex-grow">{children}</main>

                <Footer />
              </ThemeProvider>
            </body>
          </html>
        </SocketContextProvider>
      </SessionProvider>
    </EdgeStoreProvider>
  );
}
