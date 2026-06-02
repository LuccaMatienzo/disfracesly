import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import Input from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function ClienteCombobox({ error, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const { data: clientesData, isLoading } = useQuery({
    queryKey: ['clientes-search', debouncedSearch],
    queryFn: () => api.get('/clientes', { params: { limit: 10, search: debouncedSearch } }).then((r) => r.data),
    enabled: isOpen, // Solo buscamos si el dropdown está abierto
  });
  
  const clientes = clientesData?.data ?? [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (c) => {
    setSearchTerm(`${c.persona?.nombre} ${c.persona?.apellido} — ${c.persona?.documento}`);
    onChange(c.id_cliente);
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
          placeholder="Buscar cliente por dni, nombre o apellido"
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
            ) : clientes.length > 0 ? (
              <ul>
                {clientes.map((c) => (
                  <li 
                    key={c.id_cliente}
                    onClick={() => handleSelect(c)}
                    className="p-3 hover:bg-surface-container-highest cursor-pointer border-b border-divider last:border-0 transition-colors"
                  >
                    <div className="text-body-md text-on-surface font-medium">
                      {c.persona?.nombre} {c.persona?.apellido}
                    </div>
                    <div className="text-label-md text-on-surface-variant">
                      DNI: {c.persona?.documento}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-on-surface-variant text-label-lg">No se encontraron clientes.</div>
            )}
          </div>
        )}
      </div>
      
      <Button 
        type="button" 
        variant="primary" 
        className="h-[48px] shrink-0 px-4 lg:px-6 whitespace-nowrap"
        onClick={() => navigate('/admin/clientes/nuevo')}
      >
        <span className="material-symbols-outlined text-[20px] sm:mr-2">add</span>
        <span className="hidden sm:inline">Nuevo</span>
      </Button>
    </div>
  );
}
