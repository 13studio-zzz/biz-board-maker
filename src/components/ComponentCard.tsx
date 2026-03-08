import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { ComponentOption, SubOption, CustomItem, Selection } from '@/lib/pricing';

interface Props {
  component: ComponentOption;
  selected: Selection | null;
  onSelect: (sel: Partial<Selection>) => void;
  onDeselect: () => void;
  customItems?: CustomItem[];
  onCustomItemsChange?: (items: CustomItem[]) => void;
}

const ComponentCard = ({ component, selected, onSelect, onDeselect, customItems = [], onCustomItemsChange }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const isSelected = !!selected;
  const hasCustom = component.allowCustom && onCustomItemsChange;

  const handleOptionClick = (opt: SubOption) => {
    if (selected?.optionId === opt.id) {
      onDeselect();
    } else {
      const defaultQty = component.defaultQuantity || 1;
      onSelect({
        optionId: opt.id,
        quantity: component.needsQuantity ? defaultQty : 1,
        size: selected?.size,
        coating: selected?.coating || 'none',
        material: selected?.material || component.materialOptions?.[0]?.id,
        finishing: selected?.finishing || component.finishingOptions?.[0]?.id,
        magnetLock: selected?.magnetLock,
      });
    }
  };

  const update = (partial: Partial<Selection>) => {
    if (!selected) return;
    onSelect({ ...selected, ...partial });
  };

  const addCustomItem = () => {
    if (!onCustomItemsChange) return;
    onCustomItemsChange([...customItems, { id: `custom-${Date.now()}`, name: '', unitPrice: 0, quantity: 1 }]);
  };

  const updateCustomItem = (id: string, field: keyof CustomItem, value: string | number) => {
    if (!onCustomItemsChange) return;
    onCustomItemsChange(customItems.map(ci => ci.id === id ? { ...ci, [field]: value } : ci));
  };

  const removeCustomItem = (id: string) => {
    if (!onCustomItemsChange) return;
    onCustomItemsChange(customItems.filter(ci => ci.id !== id));
  };

  const activeCount = (isSelected ? 1 : 0) + customItems.filter(ci => ci.name).length;
  const selectedOpt = selected ? component.options.find(o => o.id === selected.optionId) : null;

  // Show magnet option only for 싸바리
  const showMagnet = component.hasMagnetOption && selected?.optionId === 'pkg-ssabari';
  // Show size input for 비규격 카드 or needsSize components
  const showSize = component.needsSize || (selected?.optionId === 'card-custom');

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{component.icon}</span>
          <div>
            <h3 className="font-semibold text-sm text-card-foreground">{component.name}</h3>
            <p className="text-xs text-muted-foreground">{component.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
              {activeCount}개 선택
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {/* Options */}
              {component.options.map(opt => {
                const isActive = selected?.optionId === opt.id;
                return (
                  <div key={opt.id}>
                    <button
                      onClick={() => handleOptionClick(opt)}
                      className={`w-full text-left p-3 rounded-md border transition-all text-sm ${
                        isActive
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:border-primary/30 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-card-foreground">{opt.label}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                        </div>
                      </div>
                    </button>
                    {opt.note && isActive && (
                      <p className="text-xs text-amber-600 mt-1 ml-1">{opt.note}</p>
                    )}
                  </div>
                );
              })}

              {/* Component-level notes */}
              {component.notes?.map((note, i) => (
                <p key={i} className="text-xs text-muted-foreground">{note}</p>
              ))}

              {/* Additional options when selected */}
              {selected && (
                <div className="space-y-3 pt-2 border-t border-border">
                  {/* Size: W × H × D */}
                  {showSize && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">사이즈 (mm)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="가로"
                          value={selected.size?.w || ''}
                          onChange={e => update({ size: { w: e.target.value, h: selected.size?.h || '', d: selected.size?.d || '' } })}
                          className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm text-center"
                        />
                        <span className="text-xs text-muted-foreground">×</span>
                        <input
                          type="text"
                          placeholder="세로"
                          value={selected.size?.h || ''}
                          onChange={e => update({ size: { w: selected.size?.w || '', h: e.target.value, d: selected.size?.d || '' } })}
                          className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm text-center"
                        />
                        <span className="text-xs text-muted-foreground">×</span>
                        <input
                          type="text"
                          placeholder="높이"
                          value={selected.size?.d || ''}
                          onChange={e => update({ size: { w: selected.size?.w || '', h: selected.size?.h || '', d: e.target.value } })}
                          className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm text-center"
                        />
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  {component.needsQuantity && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">{component.quantityLabel || '수량'}:</label>
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        value={selected.quantity}
                        onChange={e => update({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-20 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm text-center"
                      />
                    </div>
                  )}

                  {/* Material */}
                  {component.hasMaterial && component.materialOptions && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">재질</label>
                      <div className="flex flex-wrap gap-1.5">
                        {component.materialOptions.map(mat => (
                          <button
                            key={mat.id}
                            onClick={() => update({ material: mat.id })}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                              selected.material === mat.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/30'
                            }`}
                          >
                            {mat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Finishing */}
                  {component.hasFinishing && component.finishingOptions && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">후가공</label>
                      <div className="flex flex-wrap gap-1.5">
                        {component.finishingOptions.map(fin => (
                          <button
                            key={fin.id}
                            onClick={() => update({ finishing: fin.id })}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                              selected.finishing === fin.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/30'
                            }`}
                          >
                            {fin.label}
                          </button>
                        ))}
                      </div>
                      {selected.finishing && component.finishingOptions.find(f => f.id === selected.finishing)?.note && (
                        <p className="text-xs text-amber-600 mt-1">
                          {component.finishingOptions.find(f => f.id === selected.finishing)?.note}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Coating */}
                  {component.hasCoating && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">코팅</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'none', label: '없음' },
                          { id: 'matte', label: '무광' },
                          { id: 'glossy', label: '유광' },
                        ].map(c => (
                          <button
                            key={c.id}
                            onClick={() => update({ coating: c.id })}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                              (selected.coating || 'none') === c.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/30'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Magnet lock */}
                  {showMagnet && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.magnetLock || false}
                        onChange={e => update({ magnetLock: e.target.checked })}
                        className="rounded border-border"
                      />
                      <span className="text-xs text-card-foreground">자석 여닫이 추가 (+₩3,000)</span>
                    </label>
                  )}

                  {/* Deselect */}
                  <button onClick={onDeselect} className="text-xs text-destructive hover:underline">선택 해제</button>
                </div>
              )}

              {/* Custom items */}
              {hasCustom && (
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">직접 입력 항목</p>
                  {customItems.map(ci => (
                    <div key={ci.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="항목명"
                        value={ci.name}
                        onChange={e => updateCustomItem(ci.id, 'name', e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm"
                      />
                      <input
                        type="number"
                        placeholder="단가"
                        value={ci.unitPrice || ''}
                        onChange={e => updateCustomItem(ci.id, 'unitPrice', parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm text-right"
                      />
                      <span className="text-xs text-muted-foreground">×</span>
                      <input
                        type="number"
                        min={1}
                        value={ci.quantity}
                        onChange={e => updateCustomItem(ci.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm text-center"
                      />
                      <button onClick={() => removeCustomItem(ci.id)} className="p-1 text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addCustomItem}
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> 항목 추가
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComponentCard;
