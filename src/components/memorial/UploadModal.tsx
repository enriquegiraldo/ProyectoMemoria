import { useState } from 'react'
import { X } from 'lucide-react'

interface UploadModalProps {
  onClose: () => void;
  onSubmit: (formData: {
    type: string;
    author: string;
    relationship: string;
    content: string;
    imageUrl?: string;
  }) => void;
}

const UploadModal = ({ onClose, onSubmit }: UploadModalProps) => {
  const [formData, setFormData] = useState({
    type: 'message',
    author: '',
    relationship: '',
    content: '',
    imageUrl: ''
  });

  const handleSubmit = () => {
    if (formData.author && formData.content) {
      onSubmit(formData);
      setFormData({ type: 'message', author: '', relationship: '', content: '', imageUrl: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-black/90 border border-pink-500/30 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
            Compartir un Recuerdo
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-cyan-400 font-semibold mb-2">Tipo de recuerdo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full bg-black/60 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:outline-none"
            >
              <option value="message">Mensaje/Testimonio</option>
              <option value="photo">Foto con descripción</option>
            </select>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-cyan-400 font-semibold mb-2">Tu nombre</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                className="w-full bg-black/60 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:outline-none"
                placeholder="Escribe tu nombre"
                required
              />
            </div>
            
            <div>
              <label className="block text-cyan-400 font-semibold mb-2">Relación</label>
              <input
                type="text"
                value={formData.relationship}
                onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                className="w-full bg-black/60 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:outline-none"
                placeholder="Ej: Hermano, Amigo, Compañero"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-cyan-400 font-semibold mb-2">
              {formData.type === 'photo' ? 'Descripción de la foto' : 'Tu mensaje'}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={4}
              className="w-full bg-black/60 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:outline-none resize-none"
              placeholder={formData.type === 'photo' ? 'Describe esta foto especial...' : 'Comparte tu recuerdo, anécdota o mensaje...'}
              required
            />
          </div>
          
          {formData.type === 'photo' && (
            <div>
              <label className="block text-cyan-400 font-semibold mb-2">URL de la imagen</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                className="w-full bg-black/60 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:outline-none"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          )}
          
          <div className="flex space-x-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-pink-500 to-cyan-500 text-black font-bold py-3 px-6 rounded-lg hover:shadow-lg hover:shadow-pink-500/25 transition-all duration-300"
            >
              Compartir Recuerdo
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 text-gray-400 rounded-lg hover:border-gray-400 hover:text-white transition-all duration-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;