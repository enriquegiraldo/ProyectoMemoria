import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMemories } from '../hooks/useMemories';
import { useDispatch } from 'react-redux';
import { openModal } from '../store/slices/uiSlice';
import Header from '../components/memorial/Header';
import Hero from '../components/memorial/Hero';
import MemoriesGallery from '../components/memorial/MemoriesGallery';
import { Memory } from '../store/slices/memoriesSlice';

const MemorialPage: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const { isAuthenticated, canEdit } = useAuth();
  const { loadMemories, getMemoriesByType } = useMemories();
  const dispatch = useDispatch();

  const [currentSection, setCurrentSection] = useState('home');
  const [pageData, setPageData] = useState({
    title: 'Memoria Eterna',
    subtitle: 'Preservando recuerdos, conectando generaciones',
    personName: 'Ser Querido',
    backgroundImage: '',
    backgroundVideo: '',
    birthDate: '1980-01-01',
    passingDate: '2023-12-31',
  });

  useEffect(() => {
    if (pageId) {
      // Cargar datos de la página
      loadPageData(pageId);
      loadMemories(pageId);
    }
  }, [pageId, loadMemories]);

  const loadPageData = async (id: string) => {
    try {
      // En una implementación real, aquí se cargarían los datos de la página
      // const response = await fetch(`/api/pages/${id}`);
      // const data = await response.json();
      // setPageData(data);
      
      // Por ahora, simulamos datos
      setPageData({
        title: 'Memoria Eterna',
        subtitle: 'Preservando recuerdos, conectando generaciones',
        personName: 'María González',
        backgroundImage: '',
        backgroundVideo: '',
        birthDate: '1950-03-15',
        passingDate: '2023-11-20',
      });
    } catch (error) {
      console.error('Error loading page data:', error);
    }
  };

  const handleNavigate = (section: string) => {
    setCurrentSection(section);
    
    // Scroll suave a la sección
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddMemory = () => {
    if (!isAuthenticated) {
      dispatch(openModal({ type: 'login' }));
      return;
    }
    dispatch(openModal({ type: 'memory' }));
  };

  const handleEditMemory = (memory: Memory) => {
    dispatch(openModal({ type: 'memory', data: memory }));
  };

  const handleDeleteMemory = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este recuerdo?')) {
      // La eliminación se maneja en el hook useMemories
      console.log('Deleting memory:', id);
    }
  };

  const handleViewMemory = (memory: Memory) => {
    dispatch(openModal({ type: 'memory', data: { ...memory, viewOnly: true } }));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: pageData.title,
        text: pageData.subtitle,
        url: window.location.href,
      });
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleGenerateQR = () => {
    // La generación de QR se maneja en el componente Hero
    console.log('Generating QR for:', window.location.href);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'home':
        return (
          <div id="home">
            <Hero
              pageData={pageData}
              onShare={handleShare}
              onGenerateQR={handleGenerateQR}
            />
          </div>
        );

      case 'memories':
        return (
          <div id="memories" className="pt-16">
            <MemoriesGallery
              pageId={pageId || ''}
              onAddMemory={handleAddMemory}
              onEditMemory={handleEditMemory}
              onDeleteMemory={handleDeleteMemory}
              onViewMemory={handleViewMemory}
            />
          </div>
        );

      case 'photos':
        return (
          <div id="photos" className="pt-16">
            <MemoriesGallery
              pageId={pageId || ''}
              onAddMemory={handleAddMemory}
              onEditMemory={handleEditMemory}
              onDeleteMemory={handleDeleteMemory}
              onViewMemory={handleViewMemory}
            />
          </div>
        );

      case 'videos':
        return (
          <div id="videos" className="pt-16">
            <MemoriesGallery
              pageId={pageId || ''}
              onAddMemory={handleAddMemory}
              onEditMemory={handleEditMemory}
              onDeleteMemory={handleDeleteMemory}
              onViewMemory={handleViewMemory}
            />
          </div>
        );

      case 'music':
        return (
          <div id="music" className="pt-16">
            <MemoriesGallery
              pageId={pageId || ''}
              onAddMemory={handleAddMemory}
              onEditMemory={handleEditMemory}
              onDeleteMemory={handleDeleteMemory}
              onViewMemory={handleViewMemory}
            />
          </div>
        );

      default:
        return (
          <div id="home">
            <Hero
              pageData={pageData}
              onShare={handleShare}
              onGenerateQR={handleGenerateQR}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        pageData={pageData}
        onNavigate={handleNavigate}
      />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderSection()}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Memoria Eterna</h3>
              <p className="text-gray-300">
                Preservando recuerdos, conectando generaciones. Un espacio digital 
                para honrar a nuestros seres queridos.
              </p>
            </div>
            
            <div>
              <h4 className="text-md font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <button
                    onClick={() => handleNavigate('home')}
                    className="hover:text-white transition-colors"
                  >
                    Inicio
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('memories')}
                    className="hover:text-white transition-colors"
                  >
                    Recuerdos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('photos')}
                    className="hover:text-white transition-colors"
                  >
                    Fotos
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-semibold mb-4">Contacto</h4>
              <p className="text-gray-300">
                ¿Necesitas ayuda? Contáctanos para crear tu página memorial.
              </p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Crear Página
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Memoria Eterna. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MemorialPage;
