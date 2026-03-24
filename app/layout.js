import './globals.css';

export const metadata = {
  title: 'Polyglot OS',
  description: 'Serial sprints to C1. One language at a time.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: "'Nunito', sans-serif", background: '#f8f9fa', minHeight: '100vh' }}>
        <nav style={{
          background: 'white',
          borderBottom: '1px solid #eee',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <a href="/" style={{
            textDecoration: 'none', color: '#1a1a2e',
            fontSize: 18, fontWeight: 800, letterSpacing: -0.5
          }}>
            🌐 Polyglot OS
          </a>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="/grammar" style={{ textDecoration: 'none', color: '#555', fontSize: 14, fontWeight: 600 }}>
              📝 Grammar
            </a>
            <a href="/palace" style={{ textDecoration: 'none', color: '#555', fontSize: 14, fontWeight: 600 }}>
              🏛 Palace
            </a>
            <a href="/journal" style={{ textDecoration: 'none', color: '#555', fontSize: 14, fontWeight: 600 }}>
              📓 Journal
            </a>
            <a href="/assessment/de" style={{ textDecoration: 'none', color: '#555', fontSize: 14, fontWeight: 600 }}>
              📋 Test
            </a>
            <a href="/progress/de" style={{ textDecoration: 'none', color: '#555', fontSize: 14, fontWeight: 600 }}>
              📈 Progress
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
