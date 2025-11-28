import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Library, Video, Home, BookOpen, User, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const navItems = [
  {
    name: 'Moja galerija',
    href: '/app/galerija',
    icon: Library,
  },
  {
    name: 'Reel Studio',
    href: '/app/reel',
    icon: Video,
  },
  {
    name: 'Stage Studio',
    href: '/app/stage',
    icon: Home,
  },
  {
    name: 'Vodič & primeri',
    href: '/app/docs',
    icon: BookOpen,
  },
];

export function AppNavigation() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/app' && location.pathname === '/app') return true;
    if (href !== '/app' && location.pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className={cn("glass-nav fixed top-0 left-0 right-0 z-50", isScrolled && "scrolled")}>
      <div className="container mx-auto px-6">
        <div className="flex h-full items-center justify-between">
          {/* Logo */}
          <Link to="/app" className="flex items-center py-2">
            <img 
              src="/brand/mark.png" 
              alt="Reel Estate" 
              className="h-12 w-auto object-contain" 
              style={{ padding: '1px' }}
            />
          </Link>

          {/* Desktop Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <div
                    className={cn(
                      "glass-pill flex items-center space-x-2 px-4 py-2 text-sm font-medium brand-focus-ring",
                      isActive(item.href)
                        ? "active text-primary"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile Navigation Items */}
          <div className="flex md:hidden items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <div
                    className={cn(
                      "glass-pill flex items-center justify-center p-2 brand-focus-ring min-w-[40px]",
                      isActive(item.href)
                        ? "active text-primary"
                        : "text-text-muted hover:text-text-primary"
                    )}
                    title={item.name}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full transition-all duration-200 hover:ring-2 hover:ring-offset-2"
                style={{ 
                  '--tw-ring-color': 'var(--brand-grad)',
                  '--tw-ring-offset-color': 'transparent' 
                } as React.CSSProperties}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/app/profile" className="flex items-center cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/settings" className="flex items-center cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Podešavanja
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center cursor-pointer text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Odjava
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}