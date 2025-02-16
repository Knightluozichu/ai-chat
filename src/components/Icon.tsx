import React, { useEffect, useState } from 'react';
import { loadIcon } from './icons';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    loadIcon(name).then(setIconComponent);
  }, [name]);

  if (!IconComponent) {
    return <span className="w-5 h-5 block bg-gray-200 rounded animate-pulse" />;
  }

  return <IconComponent {...props} />;
};