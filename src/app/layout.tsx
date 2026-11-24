import "./globals.css";

export const metadata = {
  title: "CART3R — TikTok Boost",
  description: "Organize TikTok campaigns, video links and promotional assets with clear, authorized analytics.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#000", color: "#fff", fontFamily: "system-ui", margin: 0 }}>{children}</body>
    </html>
  );
}
