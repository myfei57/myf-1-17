import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Trash2, Edit3, Package, Recycle, CheckSquare, Square, Lock, AlertTriangle } from 'lucide-react';
import { PageContainer } from '../components/PageContainer';
import { PartCard } from '../components/PartCard';
import { Modal } from '../components/Modal';
import { useGameStore } from '../store/useGameStore';
import { PART_TYPE_NAMES } from '../data/defaultConfig';
import type { Part, PartType, Rarity, RecycleRecord } from '../types';
import { getRarityColorClass } from '../utils/helpers';

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<PartType | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'weight' | 'energy' | 'rarity'>('rarity');
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [showRecycleConfirm, setShowRecycleConfirm] = useState<string | null>(null);
  const [showLockedRecycleConfirm, setShowLockedRecycleConfirm] = useState<string | null>(null);
  const [batchSelectMode, setBatchSelectMode] = useState(false);
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());
  const [showBatchRecycleConfirm, setShowBatchRecycleConfirm] = useState(false);
  const [showBatchRecycleResult, setShowBatchRecycleResult] = useState<RecycleRecord | null>(null);

  const parts = useGameStore((s) => s.parts);
  const config = useGameStore((s) => s.config);
  const updatePart = useGameStore((s) => s.updatePart);
  const recyclePart = useGameStore((s) => s.recyclePart);
  const batchRecycle = useGameStore((s) => s.batchRecycle);
  const togglePartLock = useGameStore((s) => s.togglePartLock);
  const materials = useGameStore((s) => s.materials);

  const filteredParts = useMemo(() => {
    let result = [...parts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      );
    }

    if (filterType !== 'all') {
      result = result.filter((p) => p.type === filterType);
    }

    if (filterRarity !== 'all') {
      result = result.filter((p) => p.rarity === filterRarity);
    }

    const rarityOrder: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'weight':
          return b.weight - a.weight;
        case 'energy':
          return b.energy - a.energy;
        case 'rarity':
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        default:
          return 0;
      }
    });

    return result;
  }, [parts, searchTerm, filterType, filterRarity, sortBy]);

  const handleEditSave = () => {
    if (editingPart) {
      updatePart(editingPart.id, editingPart);
      setEditingPart(null);
    }
  };

  const handleRecycle = (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    if (!part) return;

    if (part.locked) {
      setShowRecycleConfirm(null);
      setShowLockedRecycleConfirm(partId);
      return;
    }

    const rate = config.recyclingRates[part.rarity];
    const gained = Math.floor(part.maxDurability * rate);
    alert(`拆解成功！获得 ${gained} 材料`);
    recyclePart(partId);
    setShowRecycleConfirm(null);
  };

  const handleLockedRecycle = (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    if (!part) return;

    const rate = config.recyclingRates[part.rarity];
    const gained = Math.floor(part.maxDurability * rate);
    alert(`拆解成功！获得 ${gained} 材料`);
    recyclePart(partId);
    setShowLockedRecycleConfirm(null);
  };

  const handleSelectPart = (partId: string) => {
    setSelectedPartIds((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const unlockedParts = filteredParts.filter((p) => !p.locked);
    if (selectedPartIds.size === unlockedParts.length) {
      setSelectedPartIds(new Set());
    } else {
      setSelectedPartIds(new Set(unlockedParts.map((p) => p.id)));
    }
  };

  const handleBatchRecycle = () => {
    const recyclableIds = Array.from(selectedPartIds).filter(
      (id) => !parts.find((p) => p.id === id)?.locked
    );
    const record = batchRecycle(recyclableIds);
    setShowBatchRecycleConfirm(false);
    setSelectedPartIds(new Set());
    setBatchSelectMode(false);
    setShowBatchRecycleResult(record);
  };

  const batchRecyclePreview = useMemo(() => {
    const rarityBreakdown: Record<Rarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    let totalMaterials = 0;
    let lockedCount = 0;

    for (const partId of selectedPartIds) {
      const part = parts.find((p) => p.id === partId);
      if (!part) continue;

      if (part.locked) {
        lockedCount++;
        continue;
      }

      const rate = config.recyclingRates[part.rarity];
      const gained = Math.floor(part.maxDurability * rate);
      totalMaterials += gained;
      rarityBreakdown[part.rarity]++;
    }

    return { rarityBreakdown, totalMaterials, lockedCount };
  }, [selectedPartIds, parts, config]);

  const rarityStats = useMemo(() => {
    const stats: Record<Rarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    parts.forEach((p) => {
      stats[p.rarity]++;
    });
    return stats;
  }, [parts]);

  const unlockedCount = filteredParts.filter((p) => !p.locked).length;
  const lockedCount = filteredParts.filter((p) => p.locked).length;

  return (
    <PageContainer
      title="零件仓库"
      subtitle={`共 ${parts.length} 个零件 | 已锁定: ${lockedCount} | 材料: ${materials}`}
    >
      {batchSelectMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 mb-4 border-neon-blue"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CheckSquare className="w-5 h-5 text-neon-blue" />
              <span className="font-display text-lg">批量选择模式</span>
              <span className="text-white/60">
                已选择 {selectedPartIds.size} / {unlockedCount} 个零件
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="btn btn-secondary text-sm"
              >
                {selectedPartIds.size === unlockedCount ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    取消全选
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    全选未锁定
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedPartIds(new Set());
                  setBatchSelectMode(false);
                }}
                className="btn btn-ghost text-sm"
              >
                取消
              </button>
              <button
                onClick={() => setShowBatchRecycleConfirm(true)}
                disabled={selectedPartIds.size === 0}
                className="btn btn-warning text-sm"
              >
                <Recycle className="w-4 h-4 mr-2" />
                批量拆解 ({selectedPartIds.size})
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="搜索零件名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/50" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as PartType | 'all')}
              className="input max-w-[150px]"
            >
              <option value="all">全部类型</option>
              {Object.entries(PART_TYPE_NAMES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>

            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value as Rarity | 'all')}
              className="input max-w-[150px]"
            >
              <option value="all">全部稀有度</option>
              {Object.entries(config.rarities).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name} ({rarityStats[key as Rarity]})
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input max-w-[150px]"
            >
              <option value="rarity">按稀有度</option>
              <option value="name">按名称</option>
              <option value="weight">按重量</option>
              <option value="energy">按能耗</option>
            </select>

            <button
              onClick={() => setBatchSelectMode(!batchSelectMode)}
              className={`btn ${batchSelectMode ? 'btn-primary' : 'btn-secondary'} text-sm`}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              {batchSelectMode ? '退出批量' : '批量选择'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-subtle">
          {Object.entries(config.rarities).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm"
              style={{ backgroundColor: value.bgColor, color: value.color }}
            >
              <span className="font-mono font-bold">{rarityStats[key as Rarity]}</span>
              <span>{value.name}</span>
            </div>
          ))}
        </div>
      </div>

      {filteredParts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-12 text-center"
        >
          <Package className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="font-display text-xl text-white/50 mb-2">仓库空空如也</h3>
          <p className="text-white/30">去盲盒页面获取一些零件吧！</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredParts.map((part, index) => (
              <motion.div
                key={part.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
              >
                <PartCard
                  part={part}
                  size="lg"
                  onEdit={setEditingPart}
                  onRecycle={(id) => setShowRecycleConfirm(id)}
                  onLockToggle={togglePartLock}
                  showLock={true}
                  showSelection={batchSelectMode}
                  selected={selectedPartIds.has(part.id)}
                  onSelect={handleSelectPart}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={editingPart !== null}
        onClose={() => setEditingPart(null)}
        title="编辑零件属性"
        size="lg"
      >
        {editingPart && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">名称</label>
                <input
                  type="text"
                  value={editingPart.name}
                  onChange={(e) =>
                    setEditingPart({ ...editingPart, name: e.target.value })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">稀有度</label>
                <select
                  value={editingPart.rarity}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      rarity: e.target.value as Rarity,
                    })
                  }
                  className="input"
                >
                  {Object.entries(config.rarities).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">类型</label>
                <select
                  value={editingPart.type}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      type: e.target.value as PartType,
                    })
                  }
                  className="input"
                >
                  {Object.entries(PART_TYPE_NAMES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">套装词条</label>
                <select
                  value={editingPart.setBonus || ''}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      setBonus: e.target.value || null,
                    })
                  }
                  className="input"
                >
                  <option value="">无</option>
                  {Object.entries(config.setBonuses).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">重量</label>
                <input
                  type="number"
                  value={editingPart.weight}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      weight: Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">能耗</label>
                <input
                  type="number"
                  value={editingPart.energy}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      energy: Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">技能槽</label>
                <input
                  type="number"
                  value={editingPart.skillSlots}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      skillSlots: Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">最大耐久</label>
                <input
                  type="number"
                  value={editingPart.maxDurability}
                  onChange={(e) =>
                    setEditingPart({
                      ...editingPart,
                      maxDurability: Number(e.target.value),
                      durability: Number(e.target.value),
                    })
                  }
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">描述</label>
              <textarea
                value={editingPart.description}
                onChange={(e) =>
                  setEditingPart({ ...editingPart, description: e.target.value })
                }
                className="input min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setEditingPart(null)}
                className="btn btn-ghost"
              >
                取消
              </button>
              <button onClick={handleEditSave} className="btn btn-primary">
                保存修改
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRecycleConfirm !== null}
        onClose={() => setShowRecycleConfirm(null)}
        title="确认拆解"
        size="sm"
      >
        {showRecycleConfirm && (
          <div>
            {(() => {
              const part = parts.find((p) => p.id === showRecycleConfirm);
              if (!part) return null;
              const rate = config.recyclingRates[part.rarity];
              const gained = Math.floor(part.maxDurability * rate);

              return (
                <div className="space-y-4">
                  <p className="text-white/70">
                    确定要拆解 <span className={getRarityColorClass(part.rarity)}>{part.name}</span> 吗？
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-background-tertiary rounded-lg">
                    <Recycle className="w-5 h-5 text-neon-green" />
                    <span className="text-white/70">预计回收材料:</span>
                    <span className="font-mono font-bold text-neon-green">+{gained}</span>
                  </div>
                  <p className="text-xs text-white/40">
                    回收率: {Math.round(rate * 100)}% ({config.rarities[part.rarity].name})
                  </p>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowRecycleConfirm(null)}
                      className="btn btn-ghost"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleRecycle(showRecycleConfirm)}
                      className="btn btn-warning"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      确认拆解
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showLockedRecycleConfirm !== null}
        onClose={() => setShowLockedRecycleConfirm(null)}
        title="锁定保护提示"
        size="sm"
      >
        {showLockedRecycleConfirm && (
          <div>
            {(() => {
              const part = parts.find((p) => p.id === showLockedRecycleConfirm);
              if (!part) return null;
              const rate = config.recyclingRates[part.rarity];
              const gained = Math.floor(part.maxDurability * rate);

              return (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-neon-yellow/10 border border-neon-yellow/30 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-neon-yellow flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-neon-yellow mb-1">该零件已锁定！</p>
                      <p className="text-white/70 text-sm">
                        您正在尝试拆解锁定的零件 <span className={getRarityColorClass(part.rarity)}>{part.name}</span>。
                        锁定状态旨在防止误操作，是否确定要继续拆解？
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-background-tertiary rounded-lg">
                    <Recycle className="w-5 h-5 text-neon-green" />
                    <span className="text-white/70">预计回收材料:</span>
                    <span className="font-mono font-bold text-neon-green">+{gained}</span>
                  </div>
                  <p className="text-xs text-white/40">
                    提示：您可以在零件卡片上点击「解锁」按钮取消锁定保护
                  </p>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowLockedRecycleConfirm(null)}
                      className="btn btn-ghost"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleLockedRecycle(showLockedRecycleConfirm)}
                      className="btn btn-warning"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      强制拆解
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showBatchRecycleConfirm}
        onClose={() => setShowBatchRecycleConfirm(false)}
        title="确认批量拆解"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            您选择了 {selectedPartIds.size} 个零件进行批量拆解。
            {batchRecyclePreview.lockedCount > 0 && (
              <span className="text-neon-yellow ml-2">
                (其中 {batchRecyclePreview.lockedCount} 个已锁定，将被跳过)
              </span>
            )}
          </p>

          <div className="p-4 bg-background-tertiary rounded-lg space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <span className="text-white/70">预计获得材料总数:</span>
              <span className="font-mono font-bold text-2xl text-neon-green">
                +{batchRecyclePreview.totalMaterials}
              </span>
            </div>

            <div>
              <p className="text-sm text-white/50 mb-2">稀有度明细:</p>
              <div className="grid grid-cols-5 gap-2">
                {(Object.entries(batchRecyclePreview.rarityBreakdown) as [Rarity, number][]).map(
                  ([rarity, count]) => {
                    const rConfig = config.rarities[rarity];
                    return (
                      <div
                        key={rarity}
                        className="p-2 rounded-lg text-center"
                        style={{ backgroundColor: rConfig.bgColor }}
                      >
                        <div
                          className="text-xs mb-1"
                          style={{ color: rConfig.color }}
                        >
                          {rConfig.name}
                        </div>
                        <div className="font-mono font-bold text-white">
                          {count}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {batchRecyclePreview.lockedCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-neon-yellow/10 rounded-lg text-sm">
                <Lock className="w-4 h-4 text-neon-yellow" />
                <span className="text-neon-yellow">
                  {batchRecyclePreview.lockedCount} 个锁定零件将不会被拆解
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowBatchRecycleConfirm(false)}
              className="btn btn-ghost"
            >
              取消
            </button>
            <button
              onClick={handleBatchRecycle}
              className="btn btn-warning"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              确认批量拆解
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showBatchRecycleResult !== null}
        onClose={() => setShowBatchRecycleResult(null)}
        title="批量拆解完成"
        size="lg"
      >
        {showBatchRecycleResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg">
              <Recycle className="w-8 h-8 text-neon-green" />
              <div>
                <p className="font-bold text-neon-green text-lg">拆解成功！</p>
                <p className="text-white/70">
                  共拆解 {showBatchRecycleResult.partsCount} 个零件
                </p>
              </div>
            </div>

            <div className="p-4 bg-background-tertiary rounded-lg space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <span className="text-white/70">获得材料:</span>
                <span className="font-mono font-bold text-2xl text-neon-green">
                  +{showBatchRecycleResult.materialsGained}
                </span>
              </div>

              <div>
                <p className="text-sm text-white/50 mb-2">拆解稀有度明细:</p>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.entries(showBatchRecycleResult.rarityBreakdown) as [Rarity, number][]).map(
                    ([rarity, count]) => {
                      const rConfig = config.rarities[rarity];
                      return (
                        <div
                          key={rarity}
                          className="p-2 rounded-lg text-center"
                          style={{ backgroundColor: rConfig.bgColor }}
                        >
                          <div
                            className="text-xs mb-1"
                            style={{ color: rConfig.color }}
                          >
                            {rConfig.name}
                          </div>
                          <div className="font-mono font-bold text-white">
                            {count}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowBatchRecycleResult(null)}
                className="btn btn-primary"
              >
                确定
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
