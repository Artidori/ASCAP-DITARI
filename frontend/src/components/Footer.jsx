export const Footer = () => (
  <footer className="text-center text-xs text-muted py-5 px-4 border-t border-ink/10" data-testid="app-footer">
    © {new Date().getFullYear()} Copyright: <b className="text-ink">Dorian Ismaili</b> · Tel:{" "}
    <a href="tel:+355695258165" className="hover:text-accent" data-testid="footer-phone">0695258165</a> · Email:{" "}
    <a href="mailto:dorianismaili81@gmail.com" className="hover:text-accent" data-testid="footer-email">dorianismaili81@gmail.com</a>
  </footer>
);
