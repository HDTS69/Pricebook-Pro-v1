import React, { useState, useEffect, useRef, useMemo } from "react";
import { Customer, Address } from "@/types/quote";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Mail, Phone, Smartphone, Home, Pencil, Check, X as CancelIcon, Users, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useCustomers } from "@/contexts/CustomerContext";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CustomerDetailsSectionProps {
  // We'll make these props optional since we can get them from context
  customer?: Customer | null;
  onUpdateCustomer?: (updatedCustomer: Customer) => void;
  onCustomerSelect?: (customerId: string) => void;
  isLoadingCustomers?: boolean;
}

export function CustomerDetailsSection({
  customer: propCustomer,
  onUpdateCustomer: propUpdateCustomer,
  onCustomerSelect: propCustomerSelect,
  isLoadingCustomers = false
}: CustomerDetailsSectionProps) {
  // Get customer data from context if not provided via props
  const { selectedCustomer, updateCustomer: contextUpdateCustomer, selectCustomer: contextSelectCustomer, allCustomers } = useCustomers();
  
  // Use props if provided, otherwise use context
  const customer = propCustomer !== undefined ? propCustomer : selectedCustomer;
  const onUpdateCustomer = propUpdateCustomer || contextUpdateCustomer;
  const onCustomerSelect = propCustomerSelect || contextSelectCustomer;
  
  const [isEditingCustomer, setIsEditingCustomer] = useState<boolean>(false);
  // Initialize with structured address
  const [editableCustomer, setEditableCustomer] = useState<Customer>(() => 
    customer ? { ...customer, billing_address: customer.billing_address ? { ...customer.billing_address } : {} } : {} as Customer
  );
  const [isSelectingCustomer, setIsSelectingCustomer] = useState<boolean>(propCustomer === null || propCustomer === undefined);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Effect to reset editable customer when the main customer prop changes or editing stops
  useEffect(() => {
    if (customer && !isEditingCustomer) {
      // Deep copy billing_address
      setEditableCustomer({ 
        ...customer, 
        billing_address: customer.billing_address ? { ...customer.billing_address } : {}
      });
    }
  }, [customer, isEditingCustomer]);

  // Effect to focus input when editing starts
  useEffect(() => {
    if (isEditingCustomer && customerNameInputRef.current) {
      customerNameInputRef.current.focus();
    }
  }, [isEditingCustomer]);
  
  // Effect to reset search query and editing state when selection mode changes
  useEffect(() => { 
    if (!isSelectingCustomer || isEditingCustomer) {
        setCustomerSearchQuery('');
    }
    if (isSelectingCustomer) {
        setIsEditingCustomer(false); // Ensure edit mode is off when selecting
        // Focus on search input when selection mode is activated
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 0);
    }
  }, [isSelectingCustomer, isEditingCustomer]);

  // Update filter logic for structured address
  const filteredCustomers = useMemo(() => {
    const lowerCaseQuery = customerSearchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
      return allCustomers;
    }
    return allCustomers.filter(cust => 
      cust.name.toLowerCase().includes(lowerCaseQuery) ||
      cust.email?.toLowerCase().includes(lowerCaseQuery) ||
      cust.phone?.toLowerCase().includes(lowerCaseQuery) ||
      cust.mobile_phone?.toLowerCase().includes(lowerCaseQuery) ||
      (cust.billing_address && (
        cust.billing_address.street?.toLowerCase().includes(lowerCaseQuery) ||
        cust.billing_address.city?.toLowerCase().includes(lowerCaseQuery) ||
        cust.billing_address.state?.toLowerCase().includes(lowerCaseQuery) ||
        cust.billing_address.postcode?.toLowerCase().includes(lowerCaseQuery)
      ))
    );
  }, [allCustomers, customerSearchQuery]);

  const handleSelectCustomer = (id: string) => {
    if (isLoadingCustomers) return; // Prevent selection while loading
    onCustomerSelect(id);
    setIsSelectingCustomer(false);
  };

  const handleStartEditCustomer = () => { 
    if (!customer) return;
    
    setEditableCustomer({ 
      ...customer, 
      billing_address: customer.billing_address ? { ...customer.billing_address } : {}
    }); 
    setIsEditingCustomer(true); 
    setIsSelectingCustomer(false); // Ensure selection mode is off
  };
  
  const handleCancelEditCustomer = () => { 
    if (!customer) return;
    
    setEditableCustomer({ 
      ...customer, 
      billing_address: customer.billing_address ? { ...customer.billing_address } : {}
    }); 
    setIsEditingCustomer(false); 
  };

  const handleSaveCustomer = () => { 
    if (editableCustomer) { 
      if (!editableCustomer.name?.trim()) { 
          alert("Customer name cannot be empty."); 
          return; 
      } 
      onUpdateCustomer(editableCustomer); // Call parent handler to save
      setIsEditingCustomer(false); // Exit editing mode
    } 
  };

  // Updated input change handler for nested address fields
  const handleCustomerInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { 
    const { name, value } = event.target; 
    setEditableCustomer(prev => {
      // Check if the field belongs to the billing_address object
      if (name.startsWith('billing_address.')) {
        const addressField = name.split('.')[1] as keyof Address;
        return {
          ...prev,
          billing_address: {
            ...(prev.billing_address || {}), // Keep nullish coalescing for safety
            [addressField]: value
          }
        };
      } else {
        // Handle top-level fields
        return { ...prev, [name]: value };
      }
    }); 
  };
  
  // handleCustomerKeyDown remains the same
  const handleCustomerKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => { 
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      handleSaveCustomer(); 
    } else if (event.key === 'Escape') { 
      handleCancelEditCustomer(); 
    } 
  };

  // Helper to format address for display
  const formatAddress = (address: Address | null | undefined): string => {
    if (!address) return "N/A";
    const parts = [
      address.street,
      address.city,
      address.state,
      address.postcode,
      address.country,
    ].filter(Boolean); // Filter out null/undefined/empty strings
    return parts.join(', ') || "N/A";
  };

  // Render customer selection UI
  const renderCustomerSelectionUI = () => (
    <div>
      <Input 
        ref={searchInputRef}
        placeholder={!customer ? "Search jobs by customer name..." : "Search customers..."}
        value={customerSearchQuery}
        onChange={(e) => setCustomerSearchQuery(e.target.value)}
        className="h-8 text-xs"
        disabled={isLoadingCustomers}
        autoFocus
      />
      {isLoadingCustomers ? (
        <div className="flex justify-center items-center h-[150px] border rounded-md bg-muted">
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
            <span className="text-xs text-muted-foreground">Loading customer data...</span>
          </div>
        </div>
      ) : (
        <ScrollArea className="h-[150px] border rounded-md">
          <div className="p-1">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(cust => (
                <div 
                  key={cust.id}
                  onClick={() => handleSelectCustomer(cust.id)}
                  className={`flex flex-col p-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer transition-colors duration-150 text-xs ${customer && cust.id === customer.id ? 'bg-accent/50 font-medium' : ''}`}
                >
                  <p className="font-semibold text-xs mb-0.5 truncate">{cust.name}</p>
                  <div className="flex items-center text-[11px] text-muted-foreground truncate">
                    <Mail className="h-2.5 w-2.5 mr-1 shrink-0"/>
                    <span>{cust.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-[11px] text-muted-foreground truncate">
                    <Phone className="h-2.5 w-2.5 mr-1 shrink-0"/>
                    <span>{cust.phone || 'N/A'}</span>
                  </div>
                  {/* Optionally display mobile or address snippet */} 
                  <div className="flex items-center text-[11px] text-muted-foreground truncate">
                    <Smartphone className="h-2.5 w-2.5 mr-1 shrink-0"/>
                    <span>{cust.mobile_phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-[11px] text-muted-foreground truncate">
                    <Home className="h-2.5 w-2.5 mr-1 shrink-0"/>
                    <span className="truncate">{formatAddress(cust.billing_address)}</span>
                  </div>
                </div>
              ))
            ) : customerSearchQuery.trim() !== '' ? (
              <p className="text-xs text-muted-foreground text-center p-4">No customers found. Try a different search term.</p>
            ) : (
              <p className="text-xs text-muted-foreground text-center p-4">Start typing to search for customers.</p>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  if (!customer) {
    return (
      <section className="/*px-4*/">
        <h3 className="text-sm font-semibold mb-2 flex items-center">
          <User className="h-4 w-4 mr-2" /> 
          Search for Job
          <div className="ml-auto flex items-center gap-1">
            {isSelectingCustomer ? (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSelectingCustomer(false)} title="Cancel Selection">
                <CancelIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsSelectingCustomer(true)} title="Search Jobs">
                <Users className="h-4 w-4" />
              </Button>
            )}
            {isLoadingCustomers && (
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent text-muted-foreground ml-2" />
            )}
          </div>
        </h3>
        <div className="text-xs bg-muted p-3 rounded-md">
          {isSelectingCustomer ? (
            renderCustomerSelectionUI()
          ) : (
            <div 
              className="text-muted-foreground text-center cursor-pointer hover:text-foreground transition-colors duration-150"
              onClick={() => setIsSelectingCustomer(true)}
            >
              <p>Search for a job by customer name.</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="/*px-4*/">
      <h3 className="text-sm font-semibold mb-2 flex items-center">
        <User className="h-4 w-4 mr-2" /> 
        Customer
        <div className="ml-auto flex items-center gap-1">
          {isEditingCustomer ? (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={handleSaveCustomer} title="Save Customer"><Check className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEditCustomer} title="Cancel Edit"><CancelIcon className="h-4 w-4" /></Button>
            </>
          ) : isSelectingCustomer ? (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSelectingCustomer(false)} title="Cancel Selection"><CancelIcon className="h-4 w-4" /></Button>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsSelectingCustomer(true)} title="Select Customer">
                  <Users className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleStartEditCustomer} title="Edit Customer Details">
                  <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </h3>
      <div className="text-xs bg-muted p-3 rounded-md">
        {isSelectingCustomer ? (
          renderCustomerSelectionUI()
        ) : isEditingCustomer && editableCustomer ? (
          // --- Customer Editing UI (Updated for new fields) ---
           <>
            {/* Name Input */}
            <div className="flex items-center h-6 mb-1"> 
              <Label htmlFor="customerName" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Name</Label>
              <Input 
                ref={customerNameInputRef} 
                id="customerName" 
                name="name" 
                value={editableCustomer.name} 
                onChange={handleCustomerInputChange} 
                onKeyDown={handleCustomerKeyDown} 
                className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
            </div>
            {/* Email Input */}
            <div className="flex items-center h-6 mb-1"> 
              <Label htmlFor="customerEmail" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Email</Label>
              <Input 
                id="customerEmail" 
                name="email" 
                type="email" 
                value={editableCustomer.email || ""} 
                onChange={handleCustomerInputChange} 
                onKeyDown={handleCustomerKeyDown} 
                className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
            </div>
            {/* Phone Input */}
            <div className="flex items-center h-6 mb-1"> 
              <Label htmlFor="customerPhone" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Phone</Label>
              <Input 
                id="customerPhone" 
                name="phone" 
                value={editableCustomer.phone || ""} 
                onChange={handleCustomerInputChange} 
                onKeyDown={handleCustomerKeyDown} 
                className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
            </div>
             {/* Mobile Phone Input */}
            <div className="flex items-center h-6 mb-1"> 
              <Label htmlFor="customerMobilePhone" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Mobile</Label>
              <Input 
                id="customerMobilePhone" 
                name="mobile_phone" 
                value={editableCustomer.mobile_phone || ""} 
                onChange={handleCustomerInputChange} 
                onKeyDown={handleCustomerKeyDown} 
                className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
            </div>
            {/* Address Street Input */}
            <div className="flex items-center h-6 mb-1"> 
              <Label htmlFor="customerAddressStreet" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Street</Label>
              <Input 
                id="customerAddressStreet" 
                name="billing_address.street" 
                value={editableCustomer.billing_address?.street || ""} 
                onChange={handleCustomerInputChange} 
                onKeyDown={handleCustomerKeyDown} 
                className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
            </div>
            {/* Address City Input */}
            <div className="flex items-center h-6 mb-1"> 
              <Label htmlFor="customerAddressCity" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">City</Label>
              <Input 
                id="customerAddressCity" 
                name="billing_address.city" 
                value={editableCustomer.billing_address?.city || ""} 
                onChange={handleCustomerInputChange} 
                onKeyDown={handleCustomerKeyDown} 
                className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
            </div>
            {/* Address State Input */}
            <div className="flex items-center h-6 mb-1"> 
              <Label htmlFor="customerAddressState" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">State</Label>
              <Input 
                id="customerAddressState" 
                name="billing_address.state" 
                value={editableCustomer.billing_address?.state || ""} 
                onChange={handleCustomerInputChange} 
                onKeyDown={handleCustomerKeyDown} 
                className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
            </div>
             {/* Address Postcode Input */}
            <div className="flex items-center h-6 mb-1"> 
              <Label htmlFor="customerAddressPostcode" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Postcode</Label>
              <Input 
                id="customerAddressPostcode" 
                name="billing_address.postcode" 
                value={editableCustomer.billing_address?.postcode || ""} 
                onChange={handleCustomerInputChange} 
                onKeyDown={handleCustomerKeyDown} 
                className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
            </div>
           </>
        ) : (
          // --- Customer Display UI (Updated for new fields) ---
           <>
            {/* Name Display */}
            <div className="flex items-center h-6 mb-1"> 
              <span className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Name</span> 
              <span className="text-xs font-sans text-foreground antialiased flex-grow truncate" style={{ lineHeight: '1.25' }}>{customer.name}</span>
            </div>
            {/* Email Display */}
            <div className="flex items-center h-6 mb-1"> 
              <span className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Email</span> 
              <span className="text-xs font-sans text-foreground antialiased flex-grow truncate" style={{ lineHeight: '1.25' }}>{customer.email || <span className="text-muted-foreground italic">N/A</span>}</span>
            </div>
            {/* Phone Display */}
            <div className="flex items-center h-6 mb-1"> 
              <span className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Phone</span> 
              <span className="text-xs font-sans text-foreground antialiased flex-grow truncate" style={{ lineHeight: '1.25' }}>{customer.phone || <span className="text-muted-foreground italic">N/A</span>}</span>
            </div>
             {/* Mobile Display */}
             <div className="flex items-center h-6 mb-1"> 
              <span className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Mobile</span> 
              <span className="text-xs font-sans text-foreground antialiased flex-grow truncate" style={{ lineHeight: '1.25' }}>{customer.mobile_phone || <span className="text-muted-foreground italic">N/A</span>}</span>
            </div>
            {/* Address Display */}
            <div className="flex items-start h-auto mb-0"> 
              <span className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased pt-px">Address</span>
              <span className="text-xs font-sans text-foreground antialiased flex-grow break-words whitespace-normal min-h-[24px]" style={{ lineHeight: '1.25' }}>
                 {formatAddress(customer.billing_address)}
              </span>
            </div>
           </>
        )}
      </div>
    </section>
  );
} 