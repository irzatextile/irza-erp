import './globals.css'

export const metadata = {
  title: 'Irza ERP',
  description: 'Inventory & AI Enhance System — Irza Textile',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
