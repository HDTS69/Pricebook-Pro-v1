import React, { useState } from 'react';
import { Service, services } from '@/lib/services';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Clock, Package } from 'lucide-react';

interface CategoryViewProps {
  categoryId: string;
  categoryName: string;
}

export function CategoryView({ categoryId, categoryName }: CategoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const categoryServices = services
    .filter(service => service.categoryId === categoryId)
    .filter(service => 
      searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categoryServices.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{service.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{service.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{service.estimatedDuration}</span>
                </div>
                <span className="font-semibold">{formatPrice(service.price)}</span>
              </div>

              {service.materials && service.materials.length > 0 && (
                <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-1">Materials:</p>
                    <ul className="list-disc list-inside">
                      {service.materials.map((material, index) => (
                        <li key={index}>{material}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {categoryServices.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No services found for your search.
        </div>
      )}
    </div>
  );
} 