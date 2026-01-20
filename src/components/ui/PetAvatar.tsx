import { PawPrint } from 'lucide-react';
import clsx from 'clsx';

const palette = ['bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-teal-500'];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getInitials = (name?: string) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join('');
};

interface PetAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  petId?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-lg',
};

export const PetAvatar = ({ name, avatarUrl, petId, size = 'md', className }: PetAvatarProps) => {
  const initials = getInitials(name ?? undefined);
  const colorClass = palette[hashString((petId ?? name ?? 'pet') as string) % palette.length];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? 'Pet avatar'}
        className={clsx('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full text-white shadow-sm',
        colorClass,
        sizeClasses[size],
        className,
      )}
      aria-label={name ?? 'Pet avatar'}
    >
      {initials ? <span className="font-semibold">{initials}</span> : <PawPrint size={16} />}
    </div>
  );
};
