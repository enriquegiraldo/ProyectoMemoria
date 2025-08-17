import { User, Heart, MessageCircle, Camera, ChevronRight } from 'lucide-react'

export const HomeSection = () => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="text-center max-w-4xl mx-auto">
      <div className="relative mb-12">
        <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-pink-500 via-cyan-500 to-yellow-500 p-1 shadow-2xl shadow-pink-500/25">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
            <User size={80} className="text-white" />
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-500 rounded-full opacity-80 animate-ping"></div>
      </div>

      <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-cyan-500 to-yellow-500 bg-clip-text text-transparent animate-pulse">
        Rubén Darío
      </h1>

      <h2 className="text-3xl md:text-4xl font-light mb-8 text-cyan-400">
        Giraldo Puentes
      </h2>

      <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
        Un espacio digital para honrar, recordar y celebrar<br />
        la vida de una persona extraordinaria
      </p>

      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <div className="bg-black/60 backdrop-blur-lg border border-pink-500/30 rounded-xl p-6 hover:border-pink-500/60 transition-all duration-300">
          <Heart className="text-pink-500 mb-2" size={24} />
          <p className="text-pink-400 font-semibold">Compartir Recuerdos</p>
        </div>

        <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-500/60 transition-all duration-300">
          <MessageCircle className="text-cyan-500 mb-2" size={24} />
          <p className="text-cyan-400 font-semibold">Testimonios</p>
        </div>

        <div className="bg-black/60 backdrop-blur-lg border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/60 transition-all duration-300">
          <Camera className="text-yellow-500 mb-2" size={24} />
          <p className="text-yellow-400 font-semibold">Momentos Especiales</p>
        </div>
      </div>
    </div>
  </div>
)

export const AboutSection = () => (
  <div className="max-w-6xl mx-auto px-4 py-16">
    <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
      Sobre Rubén Darío
    </h2>

    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <div className="bg-black/60 backdrop-blur-lg border border-pink-500/30 rounded-xl p-8 hover:border-pink-500/60 transition-all duration-300">
          <h3 className="text-2xl font-bold text-pink-400 mb-4">Su Legado</h3>
          <p className="text-gray-300 leading-relaxed">
            Rubén Darío Giraldo Puentes fue una persona que tocó la vida de muchos con su carisma,
            generosidad y sabiduría. Su impacto trasciende el tiempo y continúa inspirando a quienes
            tuvieron la fortuna de conocerlo.
          </p>
        </div>

        <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/30 rounded-xl p-8 hover:border-cyan-500/60 transition-all duration-300">
          <h3 className="text-2xl font-bold text-cyan-400 mb-4">Valores que Compartía</h3>
          <ul className="text-gray-300 space-y-2">
            <li className="flex items-center"><ChevronRight className="text-cyan-500 mr-2" size={16} /> Amor por la familia</li>
            <li className="flex items-center"><ChevronRight className="text-cyan-500 mr-2" size={16} /> Dedicación al trabajo</li>
            <li className="flex items-center"><ChevronRight className="text-cyan-500 mr-2" size={16} /> Generosidad con los demás</li>
            <li className="flex items-center"><ChevronRight className="text-cyan-500 mr-2" size={16} /> Pasión por la vida</li>
          </ul>
        </div>
      </div>

      <div className="relative">
        <div className="w-full h-96 bg-gradient-to-br from-pink-500/20 via-cyan-500/20 to-yellow-500/20 rounded-xl flex items-center justify-center border border-white/10">
          <User size={120} className="text-white/60" />
        </div>
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full opacity-60 blur-xl animate-pulse"></div>
      </div>
    </div>
  </div>
)

interface Memory {
  id: string;
  content: string;
  author: string;
  date: string;
  imageUrl?: string;
  relationship?: string;
}

interface GallerySectionProps {
  memories: Memory[];
}

export const GallerySection = ({ memories }: GallerySectionProps) => (
  <div className="max-w-7xl mx-auto px-4 py-16">
    <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
      Galería de Recuerdos
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {memories.map((memory) => (
        <div key={memory.id} className="bg-black/60 backdrop-blur-lg border border-pink-500/30 rounded-xl overflow-hidden hover:border-pink-500/60 transition-all duration-300 hover:scale-105">
          <div className="h-64 bg-gradient-to-br from-pink-500/20 to-cyan-500/20 flex items-center justify-center">
            {memory.imageUrl ? (
              <img src={memory.imageUrl} alt={memory.content} className="w-full h-full object-cover" />
            ) : (
              <Camera size={60} className="text-white/60" />
            )}
          </div>

          <div className="p-6">
            <p className="text-gray-300 mb-3">{memory.content}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{memory.author}</span>
              <span>{memory.date}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

interface MessagesSectionProps {
  memories: Memory[];
  filter: string;
  setFilter: (filter: string) => void;
}

export const MessagesSection = ({ memories, filter, setFilter }: MessagesSectionProps) => (
  <div className="max-w-6xl mx-auto px-4 py-16">
    <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
      Mensajes y Testimonios
    </h2>
    
    <div className="flex justify-center mb-12">
      <div className="flex space-x-4 bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl p-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'message', label: 'Mensajes' },
          { key: 'photo', label: 'Fotos' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-6 py-3 rounded-lg transition-all duration-300 ${
              filter === key
                ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
    
    <div className="space-y-6">
      {memories.map((memory) => (
        <div key={memory.id} className="bg-black/60 backdrop-blur-lg border border-cyan-500/30 rounded-xl p-8 hover:border-cyan-500/60 transition-all duration-300">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center text-black font-bold">
              {memory.author.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h4 className="text-cyan-400 font-semibold">{memory.author}</h4>
                <span className="text-pink-400 text-sm">• {memory.relationship}</span>
                <span className="text-gray-500 text-sm">{memory.date}</span>
              </div>
              <p className="text-gray-300 leading-relaxed">{memory.content}</p>
              {memory.imageUrl && (
                <div className="mt-4 w-32 h-24 rounded-lg overflow-hidden">
                  <img src={memory.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const TimelineSection = () => (
  <div className="max-w-4xl mx-auto px-4 py-16">
    <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
      Cronología de Vida
    </h2>
    
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-500 via-cyan-500 to-yellow-500"></div>
      
      <div className="space-y-12">
        {[
          { year: '1970', title: 'Nacimiento', description: 'Nace en una familia llena de amor y esperanza' },
          { year: '1995', title: 'Formación Profesional', description: 'Se gradúa con honores, mostrando su dedicación al estudio' },
          { year: '2000', title: 'Vida Familiar', description: 'Forma una hermosa familia, siendo un padre ejemplar' },
          { year: '2020', title: 'Logros Profesionales', description: 'Alcanza importantes metas en su carrera profesional' },
          { year: '2024', title: 'Su Legado', description: 'Sus valores y enseñanzas continúan inspirando a otros' }
        ].map((event, index) => (
          <div key={index} className="relative flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-pink-500/25">
              {event.year.slice(-2)}
            </div>
            <div className="ml-8 bg-black/60 backdrop-blur-lg border border-yellow-500/30 rounded-xl p-6 flex-1 hover:border-yellow-500/60 transition-all duration-300">
              <h3 className="text-2xl font-bold text-yellow-400 mb-2">{event.title}</h3>
              <p className="text-gray-300">{event.description}</p>
              <span className="text-sm text-gray-500">{event.year}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)