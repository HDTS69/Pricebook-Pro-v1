import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JobsPage } from '../JobsPage';
import { JobsProvider } from '@/contexts/JobContext';

// Mock the JobContext provider
jest.mock('@/contexts/JobContext', () => ({
  useJobs: () => ({
    jobs: [
      {
        id: '1',
        jobNumber: 'J-017621',
        name: 'Test Customer',
        status: 'Draft',
        totalPrice: 0,
        createdAt: '2023-04-15T00:00:00.000Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
  JobsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('JobsPage', () => {
  test('renders jobs page with correct heading', () => {
    render(
      <MemoryRouter>
        <JobsProvider>
          <JobsPage />
        </JobsProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });

  test('renders create job button', () => {
    render(
      <MemoryRouter>
        <JobsProvider>
          <JobsPage />
        </JobsProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByText('Create Job')).toBeInTheDocument();
  });

  test('displays job list when jobs are available', () => {
    render(
      <MemoryRouter>
        <JobsProvider>
          <JobsPage />
        </JobsProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByText('J-017621')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
}); 