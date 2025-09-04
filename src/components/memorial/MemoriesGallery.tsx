// src/components/memorial/MemoriesGallery.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid, List, Plus, X } from 'lucide-react';
import { useMemories } from '../../hooks/useMemories';
import { useAuth } from '../../hooks/useAuth';
import MemoryCard from './MemoryCard';
import { Memory } from '../../types';

interface MemoriesGalleryProps {
  pageId: string;
  onAddMemory?: () => void;
  onEditMemory?: (memory: Memory) => void;
  onDeleteMemory?: (id: string) => void;
  onViewMemory?: (memory: Memory) => void;
}

const MemoriesGallery: React.FC<MemoriesGalleryProps> = ({
  pageId,
  onAddMemory,
  onEditMemory,
  onDeleteMemory,
  onViewMemory,
}) => {
  const { canEdit } = useAuth();
  const {
    memories,
    isLoading,
    error,
    filters,
    loadMemories,
    updateFilters,
    resetFilters,
    getFilteredMemories,
    getMemoriesByType,
  } = useMemories();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined); // Cambiado de selectedTypes a selectedType

  useEffect(() => {
    if (pageId) {
      loadMemories({ pageId, page: 1, limit: 20 }); // Corregido: pasar objeto con page y limit
    }
  }, [pageId, loadMemories]);

  useEffect(() => {
    updateFilters({
      search: searchTerm,
      tags: selectedTags,
      mediaType: selectedType, // Usar selectedType (string | undefined)
    });
  }, [searchTerm, selectedTags, selectedType, updateFilters]);

  const filteredMemories = getFilteredMemories();
  const allTags = Array.from(new Set(memories.flatMap((m: Memory) => m.tags)));
  const allTypes = ['IMAGE', 'VIDEO', 'AUDIO'];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedType(prev => (prev === type ? undefined : type)); // Seleccionar un solo tipo o deseleccionar
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setSelectedType(undefined); // Cambiado de selectedTypes a selectedType
    resetFilters();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => loadMemories({ pageId, page: 1, limit: 20 })} // Corregido
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Recuerdos Compartidos
          </h2>
          <p className="text-gray-600">
            {filteredMemories.length} de {memories.length} recuerdos
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>

          {/* Add Memory Button */}
          {canEdit() && (
            <button
              onClick={onAddMemory}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Recuerdo</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-gray-200 rounded-lg p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Buscar en recuerdos..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags
                    .filter((tag): tag is string => typeof tag === 'string')
                    .map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Medio
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleTypeToggle(type)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'IMAGE' ? 'Imágenes' : type === 'VIDEO' ? 'Videos' : 'Audio'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedTags.length > 0 || selectedType) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={clearAllFilters}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                  <span>Limpiar filtros</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery */}
      {filteredMemories.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron recuerdos
          </h3>
          <p className="text-gray-600 mb-6">
            {memories.length === 0
              ? 'Aún no hay recuerdos compartidos en esta página.'
              : 'Intenta ajustar los filtros de búsqueda.'}
          </p>
          {canEdit() && memories.length === 0 && (
            <button
              onClick={onAddMemory}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Agregar el primer recuerdo
            </button>
          )}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-6'
          }
        >
          <AnimatePresence>
            {filteredMemories.map((memory) => (
              <motion.div
                key={memory.id}
                variants={itemVariants}
                layout
                className={viewMode === 'list' ? 'max-w-4xl mx-auto' : ''}
              >
                <MemoryCard
                  memory={memory}
                  onEdit={onEditMemory}
                  onDelete={onDeleteMemory}
                  onView={onViewMemory}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default MemoriesGallery;