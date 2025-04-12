import React, { useState, useCallback, useEffect } from 'react';
import { Service } from '@/lib/services';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, Clock, Package, PlusCircle, Layers, Pencil, Plus } from 'lucide-react';
import { Tier } from '@/types/quote';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/Tooltip';
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditServiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSaveAndAddToSelectedTier: (modifiedService: Service, wasModified: boolean) => void;
}

function EditServiceDialog({ 
  isOpen, 
  onOpenChange, 
  service, 
  onSaveAndAddToSelectedTier 
}: EditServiceDialogProps) {
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const [editedDuration, setEditedDuration] = useState("");

  useEffect(() => {
    if (isOpen && service) {
      setEditedName(service.name);
      setEditedDescription(service.description || "");
      setEditedPrice(service.price.toString());
      setEditedDuration(service.estimatedDuration || "");
    } else {
      setEditedName("");
      setEditedDescription("");
      setEditedPrice("");
      setEditedDuration("");
    }
  }, [isOpen, service]);

  const handleSave = () => {
    if (!service) return;

    const priceValue = parseFloat(editedPrice);
    if (isNaN(priceValue)) {
      console.error("Invalid price entered.");
      return;
    }

    const modifiedService: Service = {
      ...service,
      name: editedName.trim(),
      description: editedDescription.trim(),
      price: priceValue,
      estimatedDuration: editedDuration.trim(),
    };

    const wasModified = 
        modifiedService.name !== service.name ||
        modifiedService.description !== (service.description || "") ||
        modifiedService.price !== service.price ||
        modifiedService.estimatedDuration !== (service.estimatedDuration || "");

    console.log("[EditServiceDialog] Service was modified:", wasModified);
    onSaveAndAddToSelectedTier(modifiedService, wasModified);
    onOpenChange(false);
  };

  if (!isOpen || !service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Service Before Adding</DialogTitle>
          <DialogDescription>
            Modify details below. Changes apply only to the task added to the quote.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-svc-name" className="text-right">Name</Label>
            <Input id="edit-svc-name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="edit-svc-desc" className="text-right pt-2">Description</Label>
            <Textarea id="edit-svc-desc" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="col-span-3" rows={3} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-svc-price" className="text-right">Price</Label>
            <Input id="edit-svc-price" type="number" value={editedPrice} onChange={(e) => setEditedPrice(e.target.value)} className="col-span-3" step="0.01" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-svc-duration" className="text-right">Duration</Label>
            <Input id="edit-svc-duration" value={editedDuration} onChange={(e) => setEditedDuration(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save & Add to Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CategoryViewProps {
  services: Service[];
  tiers: Tier[];
  selectedTierId: string | null;
  onAddToQuote: (serviceId: string, tierIds: string[], quantity: number) => void;
  onAddOrIncrementTask: (serviceData: Service, tierId: string, wasModified: boolean, quantity: number) => void;
  onQuickAddToQuote: (serviceId: string, quantity: number) => void;
}

export function CategoryView({ 
  services,
  tiers, 
  selectedTierId,
  onAddToQuote, 
  onAddOrIncrementTask,
  onQuickAddToQuote
}: CategoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedTiers, setCheckedTiers] = useState<Record<string, Record<string, boolean>>>({});
  const [isEditServiceDialogOpen, setIsEditServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = useCallback((serviceId: string, value: string) => {
    const quantity = parseInt(value, 10);
    const newQuantity = (!isNaN(quantity) && quantity >= 1) ? quantity : 1;
    setServiceQuantities(prev => ({
      ...prev,
      [serviceId]: newQuantity,
    }));
  }, []);

  const handleTierCheckChange = useCallback((serviceId: string, tierId: string, checked: boolean) => {
    setCheckedTiers(prev => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || {}),
        [tierId]: checked,
      }
    }));
  }, []);

  const handleAddSelectedTiers = useCallback((serviceId: string) => {
    const selectedTierIds = Object.entries(checkedTiers[serviceId] || {})
      .filter(([, isChecked]) => isChecked)
      .map(([tierId]) => tierId);
    
    if (selectedTierIds.length > 0) {
      const quantity = serviceQuantities[serviceId] || 1;
      onAddToQuote(serviceId, selectedTierIds, quantity);
      setCheckedTiers(prev => ({ ...prev, [serviceId]: {} })); 
    } else {
      console.warn("No tiers selected to add.");
    }
  }, [checkedTiers, onAddToQuote, serviceQuantities]);

  const filteredServices = services.filter(service => 
    searchQuery === '' ||
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase())) 
  );

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(price);
  };

  const getSelectedTierName = useCallback((): string | null => {
    if (!selectedTierId) return null;
    return tiers.find(t => t.id === selectedTierId)?.name || null;
  }, [selectedTierId, tiers]);

  const handleOpenEditServiceDialog = useCallback((service: Service) => {
    setEditingService(service);
    setIsEditServiceDialogOpen(true);
  }, []);

  const handleSaveAndAddToSelectedTier = useCallback((modifiedService: Service, wasModified: boolean) => {
    if (!selectedTierId) {
      console.error("Cannot add service: No tier selected.");
      return;
    }
    const originalServiceId = editingService?.id;
    if (!originalServiceId) {
        console.error("Cannot add edited service: Original service ID not found.");
        return;
    }
    const quantity = serviceQuantities[originalServiceId] || 1;
    onAddOrIncrementTask(modifiedService, selectedTierId, wasModified, quantity);
  }, [selectedTierId, onAddOrIncrementTask, serviceQuantities, editingService]);

  const handleQuickAdd = useCallback((serviceId: string) => {
    if (!selectedTierId) {
      console.error("Cannot quick add: No tier selected.");
      return;
    }
    const quantity = serviceQuantities[serviceId] || 1;
    onQuickAddToQuote(serviceId, quantity);
  }, [selectedTierId, onQuickAddToQuote, serviceQuantities]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{service.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <p className="text-muted-foreground">{service.description || 'No description available.'}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{service.estimatedDuration || 'N/A'}</span>
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
              <CardFooter className="pt-4 border-t flex items-center justify-end space-x-1.5">
                <div className="flex items-center space-x-1 mr-auto">
                  <Label htmlFor={`quantity-${service.id}`} className="text-sm font-medium text-muted-foreground sr-only">Quantity</Label>
                  <Input 
                    id={`quantity-${service.id}`}
                    type="number"
                    min="1"
                    step="1"
                    value={serviceQuantities[service.id] || 1}
                    onChange={(e) => handleQuantityChange(service.id, e.target.value)}
                    className="h-8 w-16"
                    aria-label={`Quantity for ${service.name}`}
                  />
                </div>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleOpenEditServiceDialog(service)} 
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit & Add to Quote</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={!selectedTierId ? 'cursor-not-allowed' : ''}> 
                      <Button 
                        variant="ghost"
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleQuickAdd(service.id)}
                        disabled={!selectedTierId}
                        style={!selectedTierId ? { pointerEvents: 'none' } : {}}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{selectedTierId ? `Quick Add (Qty: ${serviceQuantities[service.id] || 1}) to ${getSelectedTierName() || 'Selected'} Tier` : 'Select a tier first'}</p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={tiers.length === 0 ? 'cursor-not-allowed' : ''}> 
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="icon" 
                            className="h-8 w-8" 
                            disabled={tiers.length === 0}
                            style={tiers.length === 0 ? { pointerEvents: 'none' } : {}}
                          >
                            <Layers className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tiers.length > 0 ? `Add (Qty: ${serviceQuantities[service.id] || 1}) to Specific Tiers...` : 'No tiers available'}</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-56"> 
                    {tiers.length > 0 ? (
                      <>
                        {tiers.map((tier) => (
                          <DropdownMenuCheckboxItem
                            key={tier.id}
                            checked={checkedTiers[service.id]?.[tier.id] || false}
                            onCheckedChange={(checked) => handleTierCheckChange(service.id, tier.id, !!checked)}
                            onSelect={(e) => e.preventDefault()}
                          >
                            {tier.name}
                          </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <div className="p-1">
                          <Button 
                            size="sm" 
                            className="w-full" 
                            onClick={() => handleAddSelectedTiers(service.id)}
                            disabled={!Object.values(checkedTiers[service.id] || {}).some(Boolean)}
                          >
                            Add to Selected ({Object.values(checkedTiers[service.id] || {}).filter(Boolean).length})
                          </Button>
                        </div>
                      </>
                    ) : (
                      <DropdownMenuItem disabled>No tiers available</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? 'No services found matching your search.' : 'No services available in this category.'}
          </div>
        )}
      </div>
      <EditServiceDialog
        isOpen={isEditServiceDialogOpen}
        onOpenChange={setIsEditServiceDialogOpen}
        service={editingService}
        onSaveAndAddToSelectedTier={handleSaveAndAddToSelectedTier}
      />
    </TooltipProvider>
  );
} 