import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Star, Shield } from 'lucide-react';

interface QuotePdfTemplateProps {
  quote: {
    id: string;
    name: string;
    quote_number: string;
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      address?: string;
    };
    tiers: {
      tierId: string;
      tierName: string;
      items: {
        id: string;
        name: string;
        description?: string;
        quantity: number;
        unit_price: number;
      }[];
      subtotal: number;
    }[];
    tax?: number;
    total: number; // Reflects the selected tier's total
    grandTotal: number; // Total across all tiers with tasks
    created_at: string;
    updated_at?: string;
    status: string;
    notes?: string;
  };
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  };
}

export const QuotePdfTemplate = forwardRef<HTMLDivElement, QuotePdfTemplateProps>(
  ({ quote, companyInfo }, ref) => {
    const formattedDate = quote.created_at 
      ? format(new Date(quote.created_at), 'MMMM dd, yyyy') 
      : format(new Date(), 'MMMM dd, yyyy');

    const tax = quote.tax || 0;
    const total = quote.total || 0;

    // Determine badge styling based on tier
    const getTierBadgeStyle = (tierName: string) => {
      const lowerTier = tierName.toLowerCase();
      if (lowerTier === 'gold') {
        return { backgroundColor: '#FFD700', color: '#000', icon: Star };
      } else if (lowerTier === 'silver') {
        return { backgroundColor: '#C0C0C0', color: '#000', icon: Star };
      } else if (lowerTier === 'bronze') {
        return { backgroundColor: '#CD7F32', color: '#fff', icon: Star };
      } else {
        const colorMap: { [key: string]: string } = {
          red: '#EF4444',
          blue: '#3B82F6',
          green: '#10B981',
          yellow: '#F59E0B',
          purple: '#8B5CF6',
          orange: '#F97316',
          pink: '#EC4899',
          cyan: '#06B6D4',
          magenta: '#D946EF',
          lime: '#84CC16',
          teal: '#14B8A6',
          indigo: '#4F46E5',
          maroon: '#800000',
          navy: '#000080',
          olive: '#808000',
        };
        const bgColor = colorMap[lowerTier] || '#e5e7eb';
        return { backgroundColor: bgColor, color: '#fff', icon: Shield };
      }
    };

    return (
      <div 
        ref={ref} 
        id={`quote-pdf-${quote.id}`}
        className="p-8 bg-white"
        style={{ 
          fontFamily: 'Arial, sans-serif',
          width: '800px',
          minHeight: '1100px',
          color: '#000',
          position: 'relative',
          boxSizing: 'border-box',
          padding: '40px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 12px 0', color: '#1F2937' }}>
              {companyInfo.name}
            </h1>
            {companyInfo.address && <p style={{ fontSize: '14px', margin: '0 0 4px 0', color: '#4B5563' }}>{companyInfo.address}</p>}
            {companyInfo.phone && <p style={{ fontSize: '14px', margin: '0 0 4px 0', color: '#4B5563' }}>Phone: {companyInfo.phone}</p>}
            {companyInfo.email && <p style={{ fontSize: '14px', margin: '0 0 4px 0', color: '#4B5563' }}>Email: {companyInfo.email}</p>}
            {companyInfo.website && <p style={{ fontSize: '14px', margin: '0 0 4px 0', color: '#4B5563' }}>Web: {companyInfo.website}</p>}
          </div>
          {companyInfo.logo && (
            <img 
              src={companyInfo.logo} 
              alt="Company Logo" 
              style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
              crossOrigin="anonymous"
            />
          )}
        </div>

        {/* Quote Info */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              color: '#1F2937',
              margin: 0,
            }}>
              QUOTE
            </h2>
            <div style={{ 
              backgroundColor: '#F3F4F6', 
              padding: '4px 12px', 
              borderRadius: '12px', 
              fontSize: '12px', 
              fontWeight: 500,
              color: '#4B5563'
            }}>
              {quote.status || 'Draft'}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}><strong>Quote #:</strong> {quote.quote_number}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}><strong>Date:</strong> {formattedDate}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}><strong>Customer:</strong> {quote.customer.name}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}><strong>Email:</strong> {quote.customer.email}</p>
              {quote.customer.phone && <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}><strong>Phone:</strong> {quote.customer.phone}</p>}
              {quote.customer.address && <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}><strong>Address:</strong> {quote.customer.address}</p>}
            </div>
          </div>
        </div>

        {/* Tiers Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#1F2937' }}>
            Tier Options
          </h3>
          {quote.tiers.length > 0 ? (
            quote.tiers
              .filter(tier => tier.items.length > 0) // Only show tiers with items
              .map((tier, tierIndex) => {
                const tierBadge = getTierBadgeStyle(tier.tierName);
                const TierIcon = tierBadge.icon;

                return (
                  <div key={tier.tierId} style={{ marginBottom: tierIndex < quote.tiers.length - 1 ? '40px' : '0' }}>
                    {/* Tier Badge and Name */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: tierBadge.backgroundColor,
                      color: tierBadge.color,
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '16px',
                    }}>
                      <TierIcon style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                      {tier.tierName}
                    </div>

                    {/* Items Table for This Tier */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '16px' }}>
                      <thead style={{ backgroundColor: '#F3F4F6', textAlign: 'left' }}>
                        <tr>
                          <th style={{ padding: '12px 8px', fontWeight: 600, color: '#1F2937' }}>Item</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600, color: '#1F2937' }}>Description</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600, color: '#1F2937', textAlign: 'right' }}>Quantity</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600, color: '#1F2937', textAlign: 'right' }}>Unit Price</th>
                          <th style={{ padding: '12px 8px', fontWeight: 600, color: '#1F2937', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tier.items.map((item, index) => (
                          <tr key={item.id || index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <td style={{ padding: '12px 8px', color: '#4B5563' }}>{item.name}</td>
                            <td style={{ padding: '12px 8px', color: '#4B5563' }}>{item.description || '-'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', color: '#4B5563' }}>{item.quantity}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', color: '#4B5563' }}>${item.unit_price.toFixed(2)}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', color: '#4B5563' }}>${(item.quantity * item.unit_price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Tier Subtotal */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: '256px', fontSize: '14px' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          padding: '8px 0', 
                          fontWeight: 600, 
                          color: '#1F2937'
                        }}>
                          <span>Subtotal ({tier.tierName}):</span>
                          <span>${tier.subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', padding: '12px' }}>
              No tiers with tasks available in this quote.
            </p>
          )}
        </div>

        {/* Totals Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#1F2937' }}>
            Pricing Summary
          </h3>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '256px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#4B5563' }}>
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 0', 
                fontWeight: 600, 
                borderTop: '1px solid #E5E7EB',
                color: '#1F2937'
              }}>
                <span>Total (Selected Tier):</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {quote.tiers.length > 1 && (
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px', fontStyle: 'italic' }}>
                  Note: The final price will depend on the selected tier.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: '#1F2937' }}>Notes</h3>
            <p style={{ 
              padding: '12px', 
              backgroundColor: '#F9FAFB', 
              borderRadius: '4px',
              fontSize: '14px',
              color: '#4B5563',
              whiteSpace: 'pre-wrap'
            }}>
              {quote.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '14px', 
          color: '#6B7280', 
          position: 'absolute', 
          bottom: '40px', 
          left: '40px', 
          right: '40px',
          paddingTop: '16px', 
          borderTop: '1px solid #E5E7EB' 
        }}>
          <p style={{ margin: 0 }}>Thank you for your business!</p>
        </div>
      </div>
    );
  }
);

QuotePdfTemplate.displayName = 'QuotePdfTemplate'; 