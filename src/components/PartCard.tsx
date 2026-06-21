import { motion } from 'framer-motion';
import {
  Cpu,
  Shield,
  Hand,
  Footprints,
  Zap,
  Wrench,
  Scale,
  Gauge,
  Layers,
  Heart,
  Lock,
  Unlock,
  Check,
} from 'lucide-react';
import type { Part, PartType } from '../types';
import { useGameStore } from '../store/useGameStore';
import { getRarityBorderClass, getRarityColorClass } from '../utils/helpers';
import { PART_TYPE_NAMES } from '../data/defaultConfig';

const PartIcon: Record<PartType, typeof Cpu> = {
  head: Cpu,
  body: Shield,
  arm: Hand,
  leg: Footprints,
  core: Zap,
  tool: Wrench,
};

interface PartCardProps {
  part: Part;
  onEdit?: (part: Part) => void;
  onRecycle?: (partId: string) => void;
  onLockToggle?: (partId: string) => void;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (partId: string) => void;
  showSelection?: boolean;
  showLock?: boolean;
  draggable?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showStats?: boolean;
  showName?: boolean;
}

export function PartCard({
  part,
  onEdit,
  onRecycle,
  onLockToggle,
  onClick,
  selectable = false,
  selected = false,
  onSelect,
  showSelection = false,
  showLock = false,
  size = 'md',
  showStats = true,
  showName = true,
}: PartCardProps) {
  const config = useGameStore((s) => s.config);
  const rarityConfig = config.rarities[part.rarity];
  const Icon = PartIcon[part.type];
  const rarityBorder = getRarityBorderClass(part.rarity);
  const rarityColor = getRarityColorClass(part.rarity);

  const sizeClasses = {
    xs: 'p-1.5',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const nameSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (part.locked) return;
    if (onSelect) {
      onSelect(part.id);
    }
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLockToggle) {
      onLockToggle(part.id);
    }
  };

  const handleCardClick = () => {
    if (showSelection && !part.locked && onSelect) {
      onSelect(part.id);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      whileHover={{ scale: (selectable || onClick || (showSelection && !part.locked)) ? 1.02 : 1 }}
      whileTap={(selectable || onClick || (showSelection && !part.locked)) ? { scale: 0.98 } : undefined}
      onClick={handleCardClick}
      className={`card border-2 ${rarityBorder} ${sizeClasses[size]} cursor-${
        selectable || onClick || (showSelection && !part.locked) ? 'pointer' : 'default'
      } transition-all duration-200 ${
        selected ? 'ring-2 ring-neon-blue shadow-neon-blue' : ''
      } ${part.locked ? 'opacity-75' : ''} relative overflow-hidden`}
      style={{
        background: `linear-gradient(135deg, ${rarityConfig.bgColor}, rgba(30, 41, 59, 0.9))`,
      }}
    >
      {part.locked && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-neon-yellow/20 text-neon-yellow p-1 rounded-full">
            <Lock className="w-4 h-4" />
          </div>
        </div>
      )}

      {showSelection && (
        <div
          className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            part.locked
              ? 'border-white/20 bg-white/5 cursor-not-allowed'
              : selected
              ? 'border-neon-blue bg-neon-blue'
              : 'border-white/40 bg-background-tertiary hover:border-neon-blue'
          }`}
          onClick={handleSelectClick}
        >
          {selected && !part.locked && <Check className="w-3 h-3 text-white" />}
          {part.locked && <Lock className="w-3 h-3 text-white/30" />}
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={`${iconSizes[size]} flex-shrink-0 p-2 rounded-lg bg-background-tertiary`}
          style={{ color: rarityConfig.color }}
        >
          <Icon className="w-full h-full" />
        </div>

        <div className="flex-1 min-w-0">
          {showName && (
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3
                className={`font-display font-bold truncate ${rarityColor} ${nameSizes[size]}`}
              >
                {part.name}
              </h3>
              {size !== 'xs' && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-mono"
                  style={{
                    backgroundColor: rarityConfig.bgColor,
                    color: rarityConfig.color,
                  }}
                >
                  {rarityConfig.name}
                </span>
              )}
            </div>
          )}

          {size !== 'xs' && size !== 'sm' && (
            <p className="text-xs text-white/50 mb-2">
              {PART_TYPE_NAMES[part.type]}
              {part.setBonus && (
                <span className="ml-2 text-neon-purple">
                  [套装: {config.setBonuses[part.setBonus]?.name}]
                </span>
              )}
            </p>
          )}

          {showStats && size !== 'sm' && size !== 'xs' && (
            <>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono mb-2">
                <div className="flex items-center gap-1">
                  <Scale className="w-3 h-3 text-neon-blue" />
                  <span className="text-white/70">重量:</span>
                  <span className="text-white">{part.weight}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-neon-orange" />
                  <span className="text-white/70">能耗:</span>
                  <span className="text-white">{part.energy}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-neon-purple" />
                  <span className="text-white/70">技能:</span>
                  <span className="text-white">{part.skillSlots}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-neon-green" />
                  <span className="text-white/70">耐久:</span>
                  <span className="text-white">
                    {part.durability}/{part.maxDurability}
                  </span>
                </div>
              </div>

              <p className="text-xs text-white/40 line-clamp-2">{part.description}</p>
            </>
          )}

          {size === 'lg' && (
            <div className="mt-2 flex gap-2">
              {showLock && onLockToggle && (
                <button
                  onClick={handleLockClick}
                  className={`btn text-xs px-3 py-1 flex-1 ${
                    part.locked ? 'btn-warning' : 'btn-secondary'
                  }`}
                >
                  {part.locked ? (
                    <>
                      <Unlock className="w-3 h-3 mr-1" />
                      解锁
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      锁定
                    </>
                  )}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(part);
                  }}
                  className="btn btn-secondary text-xs px-3 py-1 flex-1"
                >
                  编辑
                </button>
              )}
              {onRecycle && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecycle(part.id);
                  }}
                  className={`btn text-xs px-3 py-1 flex-1 ${
                    part.locked ? 'btn-disabled opacity-50' : 'btn-warning'
                  }`}
                >
                  拆解
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
