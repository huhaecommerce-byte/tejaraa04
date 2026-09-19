import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, ShoppingCart } from 'lucide-react';
import { useNavigate } from "@/lib/router-compat";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

interface WelcomeBannerProps {
  className?: string;
}

export const WelcomeBanner = ({ className = '' }: WelcomeBannerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = (user?.name || 'Seller').split(' ')[0];

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/3 rounded-full" />
      
      {/* Dot pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <p className="text-primary-foreground/70 text-sm font-medium tracking-wide uppercase">
              {getGreeting()} 👋
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              Welcome back, {firstName}!
            </h1>
            <p className="text-primary-foreground/80 text-sm md:text-base max-w-md">
              Manage your orders, browse products, and grow your business — all from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/15 hover:bg-white/25 text-primary-foreground border-white/20 border backdrop-blur-sm gap-2 transition-all duration-200"
              onClick={() => navigate('/dropshipping/orders')}
            >
              <ShoppingCart className="h-4 w-4" />
              View Orders
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/15 hover:bg-white/25 text-primary-foreground border-white/20 border backdrop-blur-sm gap-2 transition-all duration-200"
              onClick={() => navigate('/dropshipping/catalog')}
            >
              <BarChart3 className="h-4 w-4" />
              Browse Products
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
