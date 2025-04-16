import { generatePdfFromElement } from '../lib/pdfGenerator';

// Mock dependencies
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => {
    return {
      internal: {
        pageSize: {
          getWidth: jest.fn().mockReturnValue(210),
          getHeight: jest.fn().mockReturnValue(297),
        },
      },
      addImage: jest.fn(),
      save: jest.fn(),
    };
  });
});

jest.mock('html2canvas', () => {
  return jest.fn().mockResolvedValue({
    width: 1000,
    height: 800,
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockedImageData'),
  });
});

describe('PDF Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generatePdfFromElement should call html2canvas and jsPDF', async () => {
    // Create a mock HTML element
    const mockElement = document.createElement('div');
    
    // Call the function
    await generatePdfFromElement(mockElement);
    
    // Verify that html2canvas and jsPDF were called correctly
    expect(require('html2canvas')).toHaveBeenCalledWith(mockElement, expect.any(Object));
    expect(require('jspdf')).toHaveBeenCalled();
  });

  test('generatePdfFromElement should use default options if not provided', async () => {
    const mockElement = document.createElement('div');
    
    await generatePdfFromElement(mockElement);
    
    expect(require('jspdf')).toHaveBeenCalledWith('portrait', 'mm', 'a4');
  });

  test('generatePdfFromElement should respect provided options', async () => {
    const mockElement = document.createElement('div');
    const options = {
      filename: 'test.pdf',
      orientation: 'landscape' as const,
      format: 'letter',
      unit: 'in' as const,
    };
    
    await generatePdfFromElement(mockElement, options);
    
    expect(require('jspdf')).toHaveBeenCalledWith('landscape', 'in', 'letter');
  });
}); 