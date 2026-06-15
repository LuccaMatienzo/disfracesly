import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import Input from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PiezaForm from '@/pages/Catalogo/PiezaForm';

export default function PiezaCombobox({ error, value, onChange, defaultSearchTerm = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (defaultSearchTerm && !searchTerm) {
      setSearchTerm(defaultSearchTerm);
    }
  }, [defaultSearchTerm]);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const wrapperRef = useRef(null);

  const { data: piezasData, isLoading } = useQuery({
    queryKey: ['piezas', 'search', debouncedSearch],
    queryFn: () => api.get('/catalogo/piezas', { params: { limit: 15, search: debouncedSearch } }).then((r) => r.data),
    enabled: isOpen,
  });
  
  const piezas = piezasData?.data ?? [];

  // Si se pasa un valor inicial (por ejemplo en edición), deberíamos buscar su nombre.
  // Pero si no es crítico, podemos dejar que el usuario busque de nuevo o que el form inicialice el input.
  // Si el form inicializa, searchTerm debería reflejarlo. Omitiremos esto por simplicidad o lo gestionará el componente padre.

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (p) => {
    setSearchTerm(p.nombre);
    onChange(p.id_pieza);
    setIsOpen(false);
  };

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    onChange(''); // Invalidar selección si el usuario escribe
    setIsOpen(true);
  };

  return (
    <div className="flex flex-row flex-nowrap w-full gap-2 items-start" ref={wrapperRef}>
      <div className="relative flex-1 min-w-0">
        <Input
          placeholder="Buscar pieza por nombre..."
          value={searchTerm}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          error={error}
          autoComplete="off"
        />
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-surface-container-high border border-divider rounded-xl shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
               <div className="p-4 text-center text-on-surface-variant text-label-lg">Buscando...</div>
            ) : piezas.length > 0 ? (
              <ul>
                {piezas.map((p) => (
                  <li 
                    key={p.id_pieza}
                    onClick={() => handleSelect(p)}
                    className="p-3 hover:bg-surface-container-highest cursor-pointer border-b border-divider last:border-0 transition-colors"
                  >
                    <div className="text-body-md text-on-surface font-medium">
                      {p.nombre}
                    </div>
                    {p.descripcion && (
                      <div className="text-label-md text-on-surface-variant line-clamp-1 mt-0.5">
                        {p.descripcion}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-on-surface-variant text-label-lg">No se encontraron piezas.</div>
            )}
          </div>
        )}
      </div>
      
      <Button 
        type="button" 
        variant="primary" 
        className="h-[48px] shrink-0 px-4 lg:px-6 whitespace-nowrap"
        onClick={() => setIsModalOpen(true)}
      >
        <span className="material-symbols-outlined text-[20px] sm:mr-2">add</span>
        <span className="hidden sm:inline">Nueva Pieza</span>
      </Button>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva pieza del catálogo" size="xl">
        <PiezaForm 
          isModal={true}
          onCancelCallback={() => setIsModalOpen(false)}
          onSuccessCallback={(data) => {
            setIsModalOpen(false);
            if (data) {
              setSearchTerm(data.nombre);
              onChange(data.id_pieza);
            }
          }}
        />
      </Modal>
    </div>
  );
}
