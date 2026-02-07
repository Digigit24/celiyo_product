// src/components/consultation/ConsultationTab.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConsultationTab } from './ConsultationTab';
import { OpdVisit } from '@/types/opdVisit.types';

// Mock dependencies
vi.mock('@/hooks/useOPDTemplate', () => ({
  useOPDTemplate: () => ({
    useTemplates: vi.fn(() => ({ data: { results: [] }, isLoading: false })),
    useTemplate: vi.fn(() => ({ data: null, isLoading: false })),
    useTemplateResponses: vi.fn(() => ({ data: { results: [] }, isLoading: false, mutate: vi.fn() })),
    createTemplateResponse: vi.fn(),
    updateTemplateResponse: vi.fn(),
    uploadCanvasForResponse: vi.fn(),
    applyResponseTemplate: vi.fn(),
    convertToResponseTemplate: vi.fn(),
    useMyResponseTemplates: vi.fn(() => ({ data: [] })),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    getTenant: vi.fn(() => ({ id: '1' })),
    user: { preferences: { defaultOPDTemplate: '1' } },
  }),
}));

vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    useTenantDetail: vi.fn(() => ({ data: { settings: {} }, isLoading: false })),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ConsultationTab', () => {
  const visit: OpdVisit = {
    id: 1,
    // Add other necessary properties for OpdVisit type
  } as OpdVisit;

  it('renders without crashing', () => {
    render(<ConsultationTab visit={visit} />);
    expect(screen.getByText('Select Template')).toBeInTheDocument();
  });
});
