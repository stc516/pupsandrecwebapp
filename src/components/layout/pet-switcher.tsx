import { useAppState } from '../../hooks/useAppState';

export const PetSwitcher = () => {
  const { pets, selectedPetId, setSelectedPet } = useAppState();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden md:inline">Pet</span>
      <select
        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium focus:border-brand-accent focus:outline-none"
        value={selectedPetId}
        onChange={(event) => setSelectedPet(event.target.value)}
      >
        {pets.map((pet) => (
          <option key={pet.id} value={pet.id}>
            {pet.name}
          </option>
        ))}
      </select>
    </label>
  );
};
