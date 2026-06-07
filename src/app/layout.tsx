import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "RUNSA VoteHub",
  description: "Redeemer's University Voting System",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}