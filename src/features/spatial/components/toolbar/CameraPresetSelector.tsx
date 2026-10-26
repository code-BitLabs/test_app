import { useState, useRef, useEffect } from 'react';
import { Camera, ChevronDown, Check } from 'lucide-react';
import {
  CAMERA_PRESETS,
  CameraPresetId,
  CameraPresetOption,
  findCameraPresetOption,
} from '@/features/spatial/config/spatialToolbarOptions';
import { CameraPreset, SpatialPreferences } from '@/features/spatial/model/spatialPreferences';

export interface CameraPresetSelectorProps {
  preferences?: SpatialPreferences;
  onCameraPresetChange?: (preset: CameraPreset) => void;
  activePreset?: CameraPresetId;
  onSelectPreset?: (preset: CameraPresetId) => void;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Compact, accessible camera preset dropdown selector (~125px).
 * Replaces flat sprawling button groups with a single fixed-slot control.
 */
export function CameraPresetSelector({
  preferences,
  onCameraPresetChange,
  activePreset,
  onSelectPreset,
  disabled = false,
}: CameraPresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Resolve current active preset identifier from either prop
  const currentKey: CameraPresetId = activePreset ?? preferences?.cameraPreset ?? 'nadir';
  const activeOption = findCameraPresetOption(currentKey) ?? CAMERA_PRESETS[1];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (option: CameraPresetOption) => {
    onSelectPreset?.(option.id);
    onCameraPresetChange?.(option.preset);
    setIsOpen(false);
  };

  const tooltip = disabled
    ? 'Camera presets active in 3D Moon & Dual View'
    : `Active Camera: ${activeOption.label} (${activeOption.title})`;

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        title={tooltip}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Camera preset selector"
        data-testid="camera-preset-dropdown-trigger"
        className={`flex items-center justify-between gap-1 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border transition-colors w-[125px] min-w-[125px] ${
          disabled
            ? 'opacity-40 cursor-not-allowed border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-muted)]'
            : isOpen
              ? 'border-[var(--lm-color-selected-site)] bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] shadow-xs'
              : 'border-[var(--lm-color-border)] bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] hover:text-white hover:border-[var(--lm-color-border-strong)] cursor-pointer'
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">{activeOption.label}</span>
        </span>
        <ChevronDown
          className={`w-3 h-3 shrink-0 text-[var(--lm-color-text-muted)] transition-transform ${
            isOpen ? 'rotate-180 text-[var(--lm-color-selected-site)]' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          aria-label="Camera presets"
          className="absolute left-0 mt-1 w-56 z-50 bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-sm)] shadow-2xl p-1 flex flex-col gap-0.5 backdrop-blur-md"
        >
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--lm-color-text-muted)] border-b border-[var(--lm-color-border-subtle)] mb-0.5">
            Camera Presets (3D Moon)
          </div>
          {CAMERA_PRESETS.map((option) => {
            const isSelected = option.preset === activeOption.preset || option.id === activeOption.id;
            const OptionIcon = option.Icon;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-testid={`camera-preset-option-${option.preset}`}
                data-preset={option.id}
                onClick={() => handleSelect(option)}
                title={option.title}
                className={`flex items-center justify-between w-full px-2 py-1.5 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:bg-[var(--lm-color-surface-hover)] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <OptionIcon className={`w-3.5 h-3.5 shrink-0 ${option.iconClassName}`} />
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[var(--lm-color-selected-site)] shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
