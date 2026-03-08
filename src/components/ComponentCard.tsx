import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { ComponentOption, SubOption, CustomItem } from '@/lib/pricing';

interface Props {
  component: ComponentOption;
  selected: { optionId: string; quantity: number; sizeNote?: string } | null;
  onSelect: (optionId: string, quantity: number, sizeNote?: string) => void;
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
      onSelect(opt.id, component.needsQuantity ? defaultQty : 1, selected?.sizeNote);
    }
  };

  const addCustomItem = () => {
    if (!onCustomItemsChange) return;
    const newItem: CustomItem = {
      id: `custom-${Date.now()}`,
      name: '',
      unitPrice: 0,
      quantity: 1,
    };
    onCustomItemsChange([...customItems, newItem]);
  };

  const updateCustomItem = (id: string, field: keyof CustomItem, value: string | number) => {
    if (!onCustomItemsChange) return;
    onCustomItemsChange(customItems.map(ci => ci.id === id ? { ...ci, [field]: value } : ci));
  };

  const removeCustomItem = (id: string) => {
    if (!onCustomItemsChange) return;
    onCustomItemsChange(customItems.filter(ci => ci.id !== id));
  };

  const activeCount = (isSelected ? 1 : 0) + customItems.length;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header - always visible */}
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
              {/* Preset options */}
              {component.options.map(opt => {
                const isActive = selected?.optionId === opt.id;
                return (
                  <button
                    key={opt.id}
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
                      <span className="text-xs font-semibold text-primary whitespace-nowrap ml-2">
                        ₩{opt.basePrice.toLocaleString()}~
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Size input */}
              {selected && component.needsSize && (
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">사이즈:</label>
                  <input
                    type="text"
                    placeholder="예: 300×300×80mm"
                    value={selected.sizeNote || ''}
                    onChange={e => onSelect(selected.optionId, selected.quantity, e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm"
                  />
                </div>
              )}

              {/* Quantity input */}
              {selected && component.needsQuantity && (
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">{component.quantityLabel || '수량'}:</label>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={selected.quantity}
                    onChange={e => onSelect(selected.optionId, Math.max(1, parseInt(e.target.value) || 1), selected.sizeNote)}
                    className="w-20 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm text-center"
                  />
                </div>
              )}

              {/* Deselect */}
              {selected && (
                <div className="pt-1">
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
