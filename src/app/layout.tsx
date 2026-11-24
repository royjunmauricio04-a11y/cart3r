export const metadata = { title: "CART3R TIKTOK BOOST" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#000", color: "#fff", fontFamily: "system-ui", margin: 0 }}>{children}</body>
    </html>
  );
}
