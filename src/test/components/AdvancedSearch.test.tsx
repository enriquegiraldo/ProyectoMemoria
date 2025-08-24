import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdvancedSearch from '../../components/memorial/AdvancedSearch';

// Mock de los servicios
vi.mock('../../services/searchService', () => ({
  SearchService: {
    searchMemories: vi.fn(),
    generateSuggestions: vi.fn(),
    generateFacets: vi.fn(),
  },
}));

// Mock de las utilidades
vi.mock('../../utils', () => ({
  debounce: (fn: Function) => fn,
}));

describe('AdvancedSearch', () => {
  const mockOnSearch = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render search input', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByPlaceholderText('Buscar memorias...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
    });

    it('should render filter toggle button', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByRole('button', { name: /filtros/i })).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should call onSearch when search button is clicked', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar memorias...');
      const searchButton = screen.getByRole('button', { name: /buscar/i });

      fireEvent.change(searchInput, { target: { value: 'test query' } });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        query: 'test query',
        pageId: 'test-page',
        mediaType: 'all',
        sortBy: 'date',
        sortOrder: 'desc',
        limit: 20,
      });
    });

    it('should call onSearch when Enter key is pressed', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar memorias...');
      
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

      expect(mockOnSearch).toHaveBeenCalledWith({
        query: 'test query',
        pageId: 'test-page',
        mediaType: 'all',
        sortBy: 'date',
        sortOrder: 'desc',
        limit: 20,
      });
    });

    it('should call onClear when clear button is clicked', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar memorias...');
      const clearButton = screen.getByRole('button', { name: /limpiar/i });

      fireEvent.change(searchInput, { target: { value: 'test query' } });
      fireEvent.click(clearButton);

      expect(mockOnClear).toHaveBeenCalled();
      expect(searchInput).toHaveValue('');
    });
  });

  describe('filters functionality', () => {
    it('should toggle filters panel when filter button is clicked', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const filterButton = screen.getByRole('button', { name: /filtros/i });
      
      // Inicialmente los filtros no están visibles
      expect(screen.queryByText('Tipo de medio')).not.toBeInTheDocument();
      
      // Abrir filtros
      fireEvent.click(filterButton);
      expect(screen.getByText('Tipo de medio')).toBeInTheDocument();
      
      // Cerrar filtros
      fireEvent.click(filterButton);
      expect(screen.queryByText('Tipo de medio')).not.toBeInTheDocument();
    });

    it('should apply media type filter', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const filterButton = screen.getByRole('button', { name: /filtros/i });
      fireEvent.click(filterButton);

      const imageFilter = screen.getByLabelText('Imágenes');
      fireEvent.click(imageFilter);

      const searchButton = screen.getByRole('button', { name: /buscar/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaType: 'image',
        })
      );
    });

    it('should apply sort order filter', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const filterButton = screen.getByRole('button', { name: /filtros/i });
      fireEvent.click(filterButton);

      const sortOrderSelect = screen.getByLabelText('Orden');
      fireEvent.change(sortOrderSelect, { target: { value: 'asc' } });

      const searchButton = screen.getByRole('button', { name: /buscar/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOrder: 'asc',
        })
      );
    });

    it('should apply date range filter', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const filterButton = screen.getByRole('button', { name: /filtros/i });
      fireEvent.click(filterButton);

      const startDateInput = screen.getByLabelText('Fecha desde');
      const endDateInput = screen.getByLabelText('Fecha hasta');

      fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2023-12-31' } });

      const searchButton = screen.getByRole('button', { name: /buscar/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: '2023-01-01',
          dateTo: '2023-12-31',
        })
      );
    });

    it('should apply result limit filter', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const filterButton = screen.getByRole('button', { name: /filtros/i });
      fireEvent.click(filterButton);

      const limitSelect = screen.getByLabelText('Resultados por página');
      fireEvent.change(limitSelect, { target: { value: '50' } });

      const searchButton = screen.getByRole('button', { name: /buscar/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      );
    });
  });

  describe('suggestions', () => {
    it('should show suggestions when typing', async () => {
      const { SearchService } = require('../../services/searchService');
      SearchService.generateSuggestions.mockResolvedValue(['suggestion1', 'suggestion2']);

      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar memorias...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('suggestion1')).toBeInTheDocument();
        expect(screen.getByText('suggestion2')).toBeInTheDocument();
      });
    });

    it('should apply suggestion when clicked', async () => {
      const { SearchService } = require('../../services/searchService');
      SearchService.generateSuggestions.mockResolvedValue(['suggestion1', 'suggestion2']);

      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar memorias...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        const suggestion = screen.getByText('suggestion1');
        fireEvent.click(suggestion);
      });

      expect(searchInput).toHaveValue('suggestion1');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByLabelText('Buscar memorias')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo de medio')).toBeInTheDocument();
      expect(screen.getByLabelText('Orden')).toBeInTheDocument();
    });

    it('should handle keyboard navigation', () => {
      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar memorias...');
      const filterButton = screen.getByRole('button', { name: /filtros/i });

      // Navegación con Tab
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      filterButton.focus();
      expect(filterButton).toHaveFocus();
    });
  });

  describe('error handling', () => {
    it('should handle search service errors gracefully', async () => {
      const { SearchService } = require('../../services/searchService');
      SearchService.generateSuggestions.mockRejectedValue(new Error('Service error'));

      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar memorias...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // No debería fallar la aplicación
      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      });
    });
  });

  describe('responsive behavior', () => {
    it('should adapt to different screen sizes', () => {
      // Simular pantalla pequeña
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(
        <AdvancedSearch
          pageId="test-page"
          onSearch={mockOnSearch}
          onClear={mockOnClear}
        />
      );

      // Verificar que el componente se renderiza correctamente
      expect(screen.getByPlaceholderText('Buscar memorias...')).toBeInTheDocument();
    });
  });
});
