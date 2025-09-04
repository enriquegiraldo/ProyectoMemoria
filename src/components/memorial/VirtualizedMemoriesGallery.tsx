// src/components/memorial/VirtualizedMemoriesGallery.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useInView } from 'react-intersection-observer';
import { Search, Filter, Grid, List as ListIcon, Loader2 } from 'lucide-react';
import { useMemories } from '../../hooks/useMemories';
import { useAuth } from '../../hooks/useAuth';
import MemoryCard from './MemoryCard';
import AdvancedSearch from './AdvancedSearch';
import { Memory } from '../../types';
import { fetchMemories } from '../../store/slices/memoriesSlice';
import { useContainerWidth } from '../../hooks/useContainerWidth';

interface VirtualizedMemoriesGalleryProps {
  pageId?: string;
  className?: string;
}

const ITEM_HEIGHT = 400;
const ITEMS_PER_PAGE = 20;

const VirtualizedMemoriesGallery: React.FC<VirtualizedMemoriesGalleryProps> = ({
  pageId,
  className = '',
}) => {
  const { memories, isLoading, error, loadMemories, filters, updateFilters } = useMemories();
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Intersection observer para infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Memoizar las memorias filtradas
  const filteredMemories = useMemo(() => {
    if (!memories) return [];

    let filtered = [...memories];

    // Aplicar filtros
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        memory =>
          memory.title.toLowerCase().includes(searchLower) ||
          memory.description.toLowerCase().includes(searchLower) ||
          memory.tags.some(tag => tag.toLowerCase().includes(searchLower)),
      );
    }

    if (filters.mediaType) {
      filtered = filtered.filter(memory => memory.mediaType === filters.mediaType);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(memory =>
        memory.tags.some(tag => filters.tags!.includes(tag)),
      );
    }

    // Aplicar ordenamiento
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'date':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          case 'author':
            return a.authorName.localeCompare(b.authorName);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [memories, filters]);

  // Cargar más memorias cuando se hace scroll
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMoreMemories();
    }
  }, [inView, hasMore, isLoading]);

  const loadMoreMemories = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const nextPage = currentPage + 1;
    const result = await loadMemories({
      pageId,
      page: nextPage,
      limit: ITEMS_PER_PAGE,
      ...filters,
    });

    // Verificar si la acción fue exitosa y el payload es un arreglo
    if (result.type === fetchMemories.fulfilled.type && Array.isArray(result.payload)) {
      if (result.payload.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }
    }
    setCurrentPage(nextPage);
  }, [currentPage, hasMore, isLoading, loadMemories, pageId, filters]);

  // Función para renderizar cada item
  const renderMemoryItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const memory = filteredMemories[index];

      if (!memory) {
        return (
          <div style={style} className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        );
      }


      return (
        <motion.div
          style={style}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="p-2"
        >
          <MemoryCard memory={memory} viewMode={viewMode} className="h-full" />
        </motion.div>
      );
    },
    [filteredMemories, viewMode],
  );

  // Función para verificar si un item está cargado
  const isItemLoaded = useCallback(
    (index: number) => {
      return index < filteredMemories.length;
    },
    [filteredMemories.length],
  );

  // Función para cargar más items
  const loadMoreItems = useCallback(
    (startIndex: number, stopIndex: number) => {
      if (!isLoading && hasMore) {
        loadMoreMemories();
      }
    },
    [isLoading, hasMore, loadMoreMemories],
  );

  // Calcular altura total de la lista
  const listHeight = Math.min(filteredMemories.length * ITEM_HEIGHT, 800);
  const itemCount = hasMore ? filteredMemories.length + 1 : filteredMemories.length;

  // Cargar memorias iniciales
  useEffect(() => {
    if (pageId) {
      loadMemories({ pageId, page: 1, limit: ITEMS_PER_PAGE });
    }
  }, [pageId, loadMemories]);

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600">Error al cargar las memorias: {error}</p>
        <button
          onClick={() => loadMemories({ pageId, page: 1, limit: ITEMS_PER_PAGE })}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }
const { ref: containerRef, width: containerWidth } = useContainerWidth();
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Memorias ({filteredMemories.length})
          </h2>
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
        </div>

        <div className="flex items-center gap-2">
          {/* Búsqueda avanzada */}
          <AdvancedSearch
            pageId={pageId}
            onSearch={(results) => {
              // Los resultados se manejan internamente en el componente
            }}
            onClear={() => {
              updateFilters({ search: '' });
            }}
            className="flex-1 sm:flex-none"
          />

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md border transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>

          {/* Cambiar vista */}
          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Botón para añadir memoria */}
          {isAuthenticated && (
            <button
              onClick={() => {
                console.log('Abrir modal de añadir memoria');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Añadir Memoria
            </button>
          )}
        </div>
      </div>

      {/* Filtros expandibles */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por tipo de medio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Medio
                </label>
                <select
                  value={filters.mediaType || ''}
                  onChange={(e) => updateFilters({ mediaType: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="IMAGE">Imágenes</option>
                  <option value="VIDEO">Videos</option>
                  <option value="AUDIO">Audio</option>
                </select>
              </div>

              {/* Filtro por ordenamiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={filters.sortBy || 'date'}
                  onChange={(e) => updateFilters({ sortBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Fecha</option>
                  <option value="title">Título</option>
                  <option value="author">Autor</option>
                </select>
              </div>

              {/* Filtro por etiquetas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiquetas
                </label>
                <input
                  type="text"
                  placeholder="Separar con comas"
                  value={filters.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(Boolean);
                    updateFilters({ tags: tags.length > 0 ? tags : undefined });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    updateFilters({});
                    setShowFilters(false);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista virtualizada */}
      {filteredMemories.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden w-full">
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
            threshold={5}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={ref}
                height={listHeight}
                width={containerWidth} // Agregado: ancho del contenedor
                itemCount={itemCount}
                itemSize={ITEM_HEIGHT}
                onItemsRendered={onItemsRendered}
                className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {renderMemoryItem}
              </List>
            )}
          </InfiniteLoader>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron memorias
          </h3>
          <p className="text-gray-600">
            {isLoading ? 'Cargando...' : 'Intenta ajustar los filtros o añadir una nueva memoria.'}
          </p>
        </div>
      )}

      {/* Indicador de carga al final */}
      {hasMore && (
        <div ref={loadMoreRef} className="text-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-600 mt-2">Cargando más memorias...</p>
        </div>
      )}
    </div>
  );
};

export default VirtualizedMemoriesGallery;