import React from 'react';
import { render, screen } from '@testing-library/react';
import { AddCustomerDialog } from './AddCustomerDialog'; // This import will fail initially
import { Customer } from '@/types/quote';
import userEvent from '@testing-library/user-event';

// Mock the Shadcn Dialog component parts used within AddCustomerDialog
jest.mock('@/components/ui/Dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode, open: boolean }) => open ? <div>{children}</div> : null,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h5>{children}</h5>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));
jest.mock('@/components/ui/Input', () => (props: any) => <input {...props} data-testid="mock-input" />);
jest.mock('@/components/ui/Label', () => ({ children, htmlFor }: { children: React.ReactNode, htmlFor: string }) => <label htmlFor={htmlFor}>{children}</label>);
jest.mock('@/components/ui/Button', () => ({ children, onClick, disabled }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean }) => <button onClick={onClick} disabled={disabled}>{children}</button>);

describe('AddCustomerDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    isOpen: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
  };

  it('should render the dialog with form fields when open', () => {
    render(<AddCustomerDialog {...defaultProps} />);

    // Check for title
    expect(screen.getByRole('heading', { name: /add new customer/i })).toBeInTheDocument();

    // Check for form fields (using labels)
    expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument(); // Primary Contact Email
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument(); // Primary Contact Phone
    expect(screen.getByLabelText(/mobile/i)).toBeInTheDocument(); // Primary Contact Mobile
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
  });

  it('should update form state on input change', async () => {
    const user = userEvent.setup();
    render(<AddCustomerDialog {...defaultProps} />);

    const nameInput = screen.getByLabelText(/customer name/i);
    await user.type(nameInput, 'Test Customer Ltd');
    expect(nameInput).toHaveValue('Test Customer Ltd');

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');

    const streetInput = screen.getByLabelText(/street address/i);
    await user.type(streetInput, '99 Test Street');
    expect(streetInput).toHaveValue('99 Test Street');
  });

  it('should call onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockResolvedValue(undefined); // Mock async submit
    render(<AddCustomerDialog {...defaultProps} onSubmit={mockSubmit} />);

    // Fill form
    await user.type(screen.getByLabelText(/customer name/i), 'Submit Corp');
    await user.type(screen.getByLabelText(/email/i), 'submit@example.com');
    await user.type(screen.getByLabelText(/street address/i), '1 Submit Ln');
    await user.type(screen.getByLabelText(/city/i), 'Submitville');
    await user.type(screen.getByLabelText(/state/i), 'NSW');
    await user.type(screen.getByLabelText(/postcode/i), '2001');
    // Country has default

    const submitButton = screen.getByRole('button', { name: /add customer/i });
    await user.click(submitButton);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'Submit Corp',
      email: 'submit@example.com',
      phone: null,
      mobile_phone: null,
      billing_address: {
        street: '1 Submit Ln',
        city: 'Submitville',
        state: 'NSW',
        postcode: '2001',
        country: 'Australia',
      },
    });
    // Check if button is disabled during submission (optional but good)
    // expect(submitButton).toBeDisabled(); // This requires more complex async handling in test/component
  });

  it('should call onOpenChange(false) when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockClose = jest.fn();
    render(<AddCustomerDialog {...defaultProps} onOpenChange={mockClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledWith(false);
  });
  
  it('should display an error message if onSubmit throws an error', async () => {
    const user = userEvent.setup();
    const errorMessage = "ServiceM8 API is down";
    const mockSubmitWithError = jest.fn().mockRejectedValue(new Error(errorMessage));
    render(<AddCustomerDialog {...defaultProps} onSubmit={mockSubmitWithError} />);

    // Fill required fields
    await user.type(screen.getByLabelText(/customer name/i), 'Error Prone Inc');
    await user.type(screen.getByLabelText(/street address/i), '1 Error Way');
    await user.type(screen.getByLabelText(/city/i), 'Fail City');
    await user.type(screen.getByLabelText(/state/i), 'ERR');
    await user.type(screen.getByLabelText(/postcode/i), '0000');

    const submitButton = screen.getByRole('button', { name: /add customer/i });
    await user.click(submitButton);

    // Wait for error message to appear
    const errorElement = await screen.findByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(mockSubmitWithError).toHaveBeenCalledTimes(1);
  });

  // We will add more tests later for interactions and submission
}); 