import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Star,
  Wrench,
  Droplet,
  Toilet,
  CircleDot,
  Plug,
  Wind,
  Flame,
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryView } from '@/components/pricebook/CategoryView';
import { DashboardMenu } from '@/components/layout/DashboardMenu';
import { services } from '@/lib/services';

interface ServiceCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const serviceCategories: ServiceCategory[] = [
  {
    id: 'favourites',
    name: 'Favourites',
    icon: Star,
    color: 'text-yellow-500',
    description: 'Your most used services and tasks',
  },
  {
    id: 'service',
    name: 'Service',
    icon: Wrench,
    color: 'text-blue-500',
    description: 'General service and maintenance tasks',
  },
  {
    id: 'hot-water',
    name: 'Hot Water',
    icon: Droplet,
    color: 'text-red-500',
    description: 'Hot water system repairs and installations',
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: Toilet,
    color: 'text-indigo-500',
    description: 'General plumbing repairs and installations',
  },
  {
    id: 'drains',
    name: 'Drains',
    icon: CircleDot,
    color: 'text-green-500',
    description: 'Drain cleaning and repairs',
  },
  {
    id: 'air-conditioning',
    name: 'Air Conditioning',
    icon: Wind,
    color: 'text-sky-500',
    description: 'AC installation, service, and repairs',
  },
  {
    id: 'gas',
    name: 'Gas',
    icon: Flame,
    color: 'text-orange-500',
    description: 'Gas fitting and appliance installation',
  },
  {
    id: 'roofing',
    name: 'Roofing & Rainwater',
    icon: Home,
    color: 'text-slate-500',
    description: 'Roof repairs and rainwater solutions',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: Plug,
    color: 'text-purple-500',
    description: 'Electrical repairs and installations',
  },
];

export function PricebookPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    categories: typeof serviceCategories;
    services: typeof services;
  }>({
    categories: serviceCategories,
    services: [],
  });

  // Handle search across both categories and services
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults({
        categories: serviceCategories,
        services: [],
      });
      return;
    }

    const query = searchQuery.toLowerCase();
    const matchedCategories = serviceCategories.filter(
      category =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
    );

    const matchedServices = services.filter(
      service =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
    );

    setSearchResults({
      categories: matchedCategories,
      services: matchedServices,
    });
  }, [searchQuery]);

  // Handle sidebar hover
  const handleSidebarHover = (hovering: boolean) => {
    if (!sidebarOpen) {
      setIsHovering(hovering);
    }
  };

  return (
    <>
      <DashboardMenu isOpen={mainMenuOpen} onClose={() => setMainMenuOpen(false)} />
      
      <div className="h-screen flex">
        {/* Main Dashboard Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50"
          onClick={() => setMainMenuOpen(!mainMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Category Sidebar */}
        <div
          className={cn(
            "h-full bg-card border-r transition-all duration-300 ease-in-out flex flex-col",
            (sidebarOpen || isHovering) ? "w-64" : "w-16"
          )}
          onMouseEnter={() => handleSidebarHover(true)}
          onMouseLeave={() => handleSidebarHover(false)}
          onClick={() => !sidebarOpen && setSidebarOpen(true)}
        >
          {/* Header Section */}
          <div 
            className={cn(
              "flex items-center border-b transition-all duration-300 ease-in-out",
              (sidebarOpen || isHovering) ? "justify-center" : "justify-center",
              "p-4 sticky top-0 bg-card z-10"
            )}
          >
            <div className="w-10" /> {/* Spacer for menu button */}
            {(sidebarOpen || isHovering) && (
              <h2 className="font-semibold transition-opacity duration-200 flex-1 text-center">
                Categories
              </h2>
            )}
            <div className="w-10" /> {/* Spacer for symmetry */}
          </div>

          {/* Search Section */}
          {(sidebarOpen || isHovering) && (
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {/* Navigation Section */}
          <nav className="flex-1 overflow-y-auto p-2">
            {searchResults.categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  !(sidebarOpen || isHovering) && "justify-center p-2"
                )}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSearchQuery('');
                }}
              >
                <category.icon className={cn("h-5 w-5", category.color)} />
                {(sidebarOpen || isHovering) && <span>{category.name}</span>}
              </Button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto pt-16">
          <div className="container mx-auto p-6">
            {selectedCategory ? (
              <CategoryView
                categoryId={selectedCategory}
                categoryName={serviceCategories.find(c => c.id === selectedCategory)?.name || ''}
              />
            ) : searchResults.services.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Search Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {searchResults.services.map((service) => (
                    <Card
                      key={service.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedCategory(service.categoryId)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <span className="text-sm text-muted-foreground">
                            ({serviceCategories.find(c => c.id === service.categoryId)?.name})
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{service.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.categories.map((category) => (
                  <Card
                    key={category.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                      <div className={`p-2 rounded-full bg-background ${category.color}`}>
                        <category.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{category.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 