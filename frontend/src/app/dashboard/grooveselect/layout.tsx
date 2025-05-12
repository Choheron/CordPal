import { Finlandica } from "next/font/google"
 
// If loading a variable font, you don't need to specify the font weight
const finlandica = Finlandica({
  subsets: ['latin'],
  display: 'swap',
})
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={finlandica.className}>
      {children}
    </div>
  )
}
