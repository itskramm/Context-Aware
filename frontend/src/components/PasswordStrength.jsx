import React from 'react';

export default function PasswordStrength({ password }) {
  const getStrength = () => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, label: 'Weak', color: 'text-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'text-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'text-blue-500' };
    return { strength, label: 'Strong', color: 'text-green-500' };
  };
  
  const { strength, label, color } = getStrength();
  
  if (!password) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded ${
              i <= strength ? 'bg-current ' + color : 'bg-muted'
            }`}
          />
        ))}
      </div>
      {label && <p className={`text-xs ${color}`}>Password strength: {label}</p>}
    </div>
  );
}
