import './globals.css';

export const metadata = {
  title: 'Polyglot OS — Language Mastery System',
  description: 'Sprint to C1 fluency in 10 languages with the Mental Palace + Grammar Trainer system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
