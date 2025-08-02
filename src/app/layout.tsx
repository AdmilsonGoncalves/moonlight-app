import { Nabla } from "next/font/google";
import "./globals.css";

// Define font
const nabla = Nabla({ subsets: ['latin'] });

// Define metadata
export const metadata: { title: string; description: string } = {
  title: "fun.pump",
  description: "create token listings",
};

// Define props interface
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
    <body className={`${nabla.className}`}>
      {children}
    </body>
    </html>
  );
}
