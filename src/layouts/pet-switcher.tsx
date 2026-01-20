import { ChevronDown } from 'lucide-react';

import { useAppState } from '../hooks/useAppState';
import { PetAvatar } from '../components/ui/PetAvatar';

export const PetSwitcher = () => {
  const { pets, selectedPetId, setSelectedPet } = useAppState();
  if (pets.length === 0) return null;
  const disabled = false;
  const currentValue = selectedPetId || pets[0]?.id || '';
  const currentPet = pets.find((p) => p.id === currentValue);

  return (
    <div data-tour="pet-switcher" className="relative z-30 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
      <PetAvatar
        name={currentPet?.name}
        avatarUrl={currentPet?.avatarUrl}
        petId={currentPet?.id}
        size="sm"
      />
      <div className="flex flex-col">
        <span className="text-xs text-text-muted">Pet</span>
        <select
          className="pointer-events-auto cursor-pointer bg-transparent text-sm font-semibold text-brand-primary focus:outline-none"
          value={currentValue}
          onChange={(event) => {
            if (disabled) return;
            void setSelectedPet(event.target.value);
          }}
          disabled={disabled}
          aria-disabled={disabled}
          aria-label="Select pet"
        >
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name}
            </option>
          ))}
        </select>
      </div>
      <ChevronDown size={16} className="text-brand-primary" />
    </div>
  );
};
