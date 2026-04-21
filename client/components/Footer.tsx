import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-600 to-emerald-500 text-white grid place-items-center text-sm font-bold">
              QC
            </div>
            <span className="font-semibold">QuickCourt</span>
          </Link>

          {/* Minimal Links */}
          <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/venues" className="hover:text-foreground">Venues</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </nav>

          {/* Admin Login */}
          <div className="flex items-center gap-3">
            <Button asChild variant="default" size="sm" className="rounded-full px-4">
              <Link to="/login?role=admin">Admin Login</Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          © {year} QuickCourt. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
