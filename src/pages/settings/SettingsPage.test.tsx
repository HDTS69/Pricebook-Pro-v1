import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage'; // Component to be created/tested
import * as servicem8 from '@/lib/servicem8'; // Import servicem8 module to mock
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Mock the servicem8 module
jest.mock('@/lib/servicem8');

// Mock Supabase if needed (e.g., for user session)
// jest.mock('@/lib/supabase', () => ({ ... }));

// Mock components used by SettingsPage if necessary (e.g., Button, Card)
jest.mock('@/components/ui/Button', () => ({ children, onClick, disabled }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean }) => <button onClick={onClick} disabled={disabled}>{children}</button>);
jest.mock('@/components/ui/Card', () => ({
    Card: ({ children }: {children: React.ReactNode}) => <div>{children}</div>,
    CardHeader: ({ children }: {children: React.ReactNode}) => <div>{children}</div>,
    CardTitle: ({ children }: {children: React.ReactNode}) => <h6>{children}</h6>,
    CardDescription: ({ children }: {children: React.ReactNode}) => <p>{children}</p>,
    CardContent: ({ children }: {children: React.ReactNode}) => <div>{children}</div>,
    CardFooter: ({ children }: {children: React.ReactNode}) => <div>{children}</div>,
}));

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

describe('SettingsPage', () => {
  // Typed mock function
  const mockGetActiveServiceM8Token = servicem8.getActiveServiceM8Token as jest.MockedFunction<typeof servicem8.getActiveServiceM8Token>;
  // Mock for the disconnect function we will create later
  const mockDisconnectServiceM8 = jest.fn(); 
  // Assign the mock to the servicem8 module (assuming we'll add disconnectServiceM8 there)
  (servicem8 as any).disconnectServiceM8 = mockDisconnectServiceM8;

  // Mock function for the toast call
  const mockToast = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockGetActiveServiceM8Token.mockClear();
    mockDisconnectServiceM8.mockClear();
    mockToast.mockClear();
    // Assign the mock function to the useToast hook mock
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast }); 
  });

  it('should display loading state initially', () => {
    mockGetActiveServiceM8Token.mockResolvedValue(new Promise(() => {})); // Promise that never resolves
    render(<SettingsPage />);
    expect(screen.getByText(/checking servicem8 status/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /disconnect/i })).not.toBeInTheDocument();
  });

  it('should display connected status and disconnect button if token exists', async () => {
    mockGetActiveServiceM8Token.mockResolvedValue('valid-token-123');
    render(<SettingsPage />);
    
    // Wait for the status check to complete
    await waitFor(() => {
        expect(screen.getByText(/connected to servicem8/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/checking servicem8 status/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disconnect servicem8/i })).toBeInTheDocument();
  });

  it('should display not connected status and connect button if token is null', async () => {
    mockGetActiveServiceM8Token.mockResolvedValue(null);
    render(<SettingsPage />);

    await waitFor(() => {
        expect(screen.getByText(/not connected to servicem8/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/checking servicem8 status/i)).not.toBeInTheDocument();
    // Check for the Connect button
    expect(screen.getByRole('button', { name: /connect servicem8/i })).toBeInTheDocument(); 
    expect(screen.queryByRole('button', { name: /disconnect servicem8/i })).not.toBeInTheDocument();
  });

  it('should display error message if token check fails', async () => {
    const errorMessage = "Failed to check status";
    mockGetActiveServiceM8Token.mockRejectedValue(new Error(errorMessage));
    render(<SettingsPage />);

    await waitFor(() => {
        // Check for a generic error message or the specific one
        expect(screen.getByText(/error checking servicem8 status/i)).toBeInTheDocument();
        // Optionally check for the specific error: expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(screen.queryByText(/checking servicem8 status/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /disconnect/i })).not.toBeInTheDocument();
  });

  // Test for clicking the Connect button (assuming window.location.href change)
  it('should redirect to ServiceM8 auth URL when connect button is clicked', async () => {
    mockGetActiveServiceM8Token.mockResolvedValue(null);
    // Mock window.location.href - Create a writable mock property
    const originalLocation = window.location;
    // Delete the existing property descriptor (necessary for some environments)
    // @ts-ignore 
    delete window.location;
    // Create a new writable descriptor
    window.location = { ...originalLocation, href: '' };
    const locationSpy = jest.spyOn(window.location, 'href', 'set');

    const user = userEvent.setup();
    render(<SettingsPage />);

    // Wait for the button to appear
    const connectButton = await screen.findByRole('button', { name: /connect servicem8/i });
    await user.click(connectButton);

    // Check if window.location.href was set to the auth URL
    expect(locationSpy).toHaveBeenCalledTimes(1);
    expect(locationSpy).toHaveBeenCalledWith(expect.stringContaining('https://go.servicem8.com/oauth/authorize'));
    expect(locationSpy).toHaveBeenCalledWith(expect.stringContaining('client_id=')); // Check essential params
    expect(locationSpy).toHaveBeenCalledWith(expect.stringContaining('redirect_uri='));
    expect(locationSpy).toHaveBeenCalledWith(expect.stringContaining('scope='));

    // Restore original window.location
    locationSpy.mockRestore();
    window.location = originalLocation;
  });

  it('should call disconnect function and show success toast when disconnect succeeds', async () => {
    mockGetActiveServiceM8Token.mockResolvedValue('valid-token-123');
    mockDisconnectServiceM8.mockResolvedValue(true); // Simulate successful disconnect
    const user = userEvent.setup();

    render(<SettingsPage />);

    const disconnectButton = await screen.findByRole('button', { name: /disconnect servicem8/i });
    await user.click(disconnectButton);

    expect(mockDisconnectServiceM8).toHaveBeenCalledTimes(1);

    // Check if toast was called with success message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringMatching(/success/i),
        description: expect.stringMatching(/disconnected from servicem8/i),
      }));
    });

    // Also check if status updates
    expect(screen.getByText(/not connected to servicem8/i)).toBeInTheDocument();
  });

  it('should show error toast when disconnect fails', async () => {
    mockGetActiveServiceM8Token.mockResolvedValue('valid-token-123');
    const errorMsg = "Disconnection failed unexpectedly";
    mockDisconnectServiceM8.mockRejectedValue(new Error(errorMsg)); // Simulate failed disconnect
    const user = userEvent.setup();

    render(<SettingsPage />);

    const disconnectButton = await screen.findByRole('button', { name: /disconnect servicem8/i });
    await user.click(disconnectButton);

    expect(mockDisconnectServiceM8).toHaveBeenCalledTimes(1);

    // Check if toast was called with error message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: expect.stringMatching(/error/i),
        description: expect.stringContaining(errorMsg), // Check if original error is included
      }));
    });

    // Status should remain connected, error should be displayed in component state too
    expect(screen.getByText(/connected to servicem8/i)).toBeInTheDocument(); 
    expect(screen.getByText(errorMsg)).toBeInTheDocument(); // Error from component state
  });

}); 