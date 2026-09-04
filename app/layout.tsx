import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import NavBar from "@/components/layout/NavBar";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Derin's Blog Spot",
  description: "Your favorite Web Dev Blogs!",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "antialiased flex flex-col min-h-screen px-2",
          roboto.variable,
        )}
      >
        <NavBar />
        <main className="flex-grow">{children}</main>

        <footer>...</footer>
      </body>
    </html>
  );
}
