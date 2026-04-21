import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { User, Settings, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";

const BrandNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Pages with hero sections that should have transparent navbar initially
  const heroPages = ['/'];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine navbar style based on page and scroll position
  const getNavbarStyle = () => {
    const isHeroPage = heroPages.includes(location.pathname);
    
    if (isHeroPage && scrollY < window.innerHeight * 0.8) {
      // In hero section - transparent with white text
      return {
        background: 'transparent',
        textColor: 'text-white',
        logoColor: 'text-white drop-shadow-lg',
  buttonStyle: 'text-white hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none',
  navBackground: 'bg-white/10 backdrop-blur-sm border-white/25',
  loginButton: 'bg-brand text-brand-foreground hover:brightness-110 shadow-[var(--shadow-elegant)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-2)/0.6)]'
      };
    } else {
      // Past hero section or non-hero pages - white background with dark text
      return {
        background: 'bg-white shadow-sm border-b border-gray-100',
        textColor: 'text-gray-900',
        logoColor: 'text-green-600',
  buttonStyle: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand))] focus-visible:outline-none',
  navBackground: 'bg-gray-50/80 backdrop-blur-sm border-gray-200',
  loginButton: 'bg-brand text-brand-foreground hover:brightness-110 shadow-[var(--shadow-elegant)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-2)/0.55)]'
      };
    }
  };

  const navStyle = getNavbarStyle();

  const handleMobileNavClick = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${navStyle.background}`}>
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <div className="px-2 sm:px-6 py-3 flex items-center">
          <Link to="/" className={`flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight transition-colors duration-300 ${navStyle.logoColor}`}>
            <span className={`inline-grid place-items-center w-8 h-8 rounded-md text-sm font-bold transition-all duration-300 ${
              scrollY < window.innerHeight * 0.8 && heroPages.includes(location.pathname)
                ? 'bg-white/20 backdrop-blur-sm text-white border border-white/30'
                : 'bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-md'
            }`}>QC</span>
            <span>QuickCourt</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className={`hidden lg:flex rounded-full p-1 items-center gap-1 border transition-all duration-300 ${navStyle.navBackground}`}>
          <Button 
            variant="ghost" 
            className={`rounded-full px-6 transition-colors duration-300 ${navStyle.buttonStyle}`} 
            onClick={() => navigate('/about')}
          >
            About
          </Button>
          {isAuthenticated && user?.role !== 'OWNER' && (
            <>
              <Button 
                variant="ghost" 
                className={`rounded-full px-6 transition-colors duration-300 ${navStyle.buttonStyle}`} 
                onClick={() => navigate('/play')}
              >
                Play
              </Button>
              <Button 
                variant="ghost" 
                className={`rounded-full px-6 transition-colors duration-300 ${navStyle.buttonStyle}`} 
                onClick={() => navigate('/book')}
              >
                Book
              </Button>
              <Button 
                variant="ghost" 
                className={`rounded-full px-6 transition-colors duration-300 ${navStyle.buttonStyle}`} 
                onClick={() => navigate('/train')}
              >
                Train
              </Button>
            </>
          )}
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`relative h-9 w-9 rounded-full ml-2 transition-colors duration-300 ${navStyle.buttonStyle}`}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                    <AvatarFallback className={`transition-colors duration-300 ${scrollY < window.innerHeight * 0.8 ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {user?.fullName ? getInitials(user.fullName) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.fullName || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {user?.role !== 'OWNER' && (
                  <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </DropdownMenuItem>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {user?.role === 'OWNER' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/owner/dashboard')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Owner Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              className={`ml-2 px-6 rounded-full font-medium transition-all duration-300 ${navStyle.loginButton}`} 
              onClick={() => navigate('/login')}
            >
              Login / Sign up
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center space-x-2 lg:hidden">
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`relative h-9 w-9 rounded-full transition-colors duration-300 ${navStyle.buttonStyle}`}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                    <AvatarFallback className={`transition-colors duration-300 ${scrollY < window.innerHeight * 0.8 ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {user?.fullName ? getInitials(user.fullName) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.fullName || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {user?.role !== 'OWNER' && (
                  <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </DropdownMenuItem>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {user?.role === 'OWNER' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/owner/dashboard')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Owner Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className={`transition-colors duration-300 ${navStyle.buttonStyle} p-2`}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="mt-4 mb-4 flex items-center justify-between">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                  <span className="inline-grid place-items-center w-8 h-8 rounded-md bg-gradient-to-br from-green-600 to-emerald-500 text-white text-sm font-bold shadow-md">QC</span>
                  <span className="font-semibold text-gray-900">QuickCourt</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-col space-y-4 mt-2">
                {isAuthenticated && user?.role !== 'OWNER' && (
                  <>
                    <Button
                      variant="ghost"
                      className="justify-start text-lg py-6"
                      onClick={() => handleMobileNavClick('/play')}
                    >
                      🏸 Play
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-lg py-6"
                      onClick={() => handleMobileNavClick('/book')}
                    >
                      📅 Book
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-lg py-6"
                      onClick={() => handleMobileNavClick('/train')}
                    >
                      🏆 Train
                    </Button>
                  </>
                )}

                <div className="border-t pt-4 mt-6">
                  <Button
                    variant="ghost"
                    className="justify-start w-full text-lg py-6"
                    onClick={() => handleMobileNavClick('/about')}
                  >
                    ℹ️ About
                  </Button>
                  {!isAuthenticated ? (
                    <div className="space-y-2">
                      <Button 
                        className="w-full py-6 text-lg" 
                        onClick={() => handleMobileNavClick('/login')}
                      >
                        Login
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full py-6 text-lg" 
                        onClick={() => handleMobileNavClick('/signup')}
                      >
                        Sign Up
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="justify-start w-full text-lg py-6"
                        onClick={() => handleMobileNavClick('/profile')}
                      >
                        <User className="mr-3 h-5 w-5" />
                        Profile
                      </Button>
                      {user?.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          className="justify-start w-full text-lg py-6"
                          onClick={() => handleMobileNavClick('/my-bookings')}
                        >
                          <Settings className="mr-3 h-5 w-5" />
                          My Bookings
                        </Button>
                      )}
                      {user?.role === 'ADMIN' && (
                        <Button
                          variant="ghost"
                          className="justify-start w-full text-lg py-6"
                          onClick={() => handleMobileNavClick('/admin')}
                        >
                          <Settings className="mr-3 h-5 w-5" />
                          Admin Dashboard
                        </Button>
                      )}
                      {user?.role === 'OWNER' && (
                        <Button
                          variant="ghost"
                          className="justify-start w-full text-lg py-6"
                          onClick={() => handleMobileNavClick('/owner/dashboard')}
                        >
                          <Settings className="mr-3 h-5 w-5" />
                          Owner Dashboard
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="justify-start w-full text-lg py-6 text-red-600"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Log out
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default BrandNav;
