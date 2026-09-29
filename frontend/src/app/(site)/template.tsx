/**
 * Contrairement au layout, le template est ré-monté à chaque navigation :
 * chaque page entre avec un léger fondu (désactivé si l'utilisateur réduit les animations).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
