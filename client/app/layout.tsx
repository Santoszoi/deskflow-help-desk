import type { Metadata } from 'next';
import '../src/styles.css';
export const metadata: Metadata = {title:'DeskFlow | Help Desk',description:'Central de chamados e atendimento técnico.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
