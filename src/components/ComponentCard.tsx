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
        stickerAttach: selected?.stickerAttach,
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

  // Show magnet option only for 싸바리
  const showMagnet = component.hasMagnetOption && selected?.optionId === 'pkg-ssabari';
  // Show size input for 비규격 카드 or needsSize components
  const showSize = component.needsSize || (selected?.optionId === 'card-custom');

  const sizeFields = component.sizeFields || ['w', 'h'];
  const sizeLabels: Record<string, string> = { w: '가로', h: '세로', d: '높이' };

  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm transition-shadow ${isSelected ? 'border-primary/40 bg-card shadow-md' : 'border-border bg-card hover:shadow-sm'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 transition-colors text-left ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
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

                    {/* 상세설정 - 선택된 옵션 바로 아래 표시 */}
                    {isActive && selected && (
                      <div className="mt-1 space-y-3 rounded-lg bg-[hsl(220,20%,14%)] p-4 border border-[hsl(220,15%,25%)]">
                        <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">상세 설정</p>

                        {/* Size fields */}
                        {showSize && (
                          <div>
                            <label className="text-xs text-white mb-1 block">사이즈 (mm)</label>
                            <div className="flex items-center gap-1.5">
                              {sizeFields.map((field, idx) => (
                                <div key={field} className="flex items-center gap-1.5">
                                  {idx > 0 && <span className="text-xs text-white/50">×</span>}
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder={sizeLabels[field]}
                                    value={selected.size?.[field] || ''}
                                    onChange={e => {
                                      const val = e.target.value.replace(/[^0-9]/g, '');
                                      update({
                                        size: {
                                          w: field === 'w' ? val : (selected.size?.w || ''),
                                          h: field === 'h' ? val : (selected.size?.h || ''),
                                          d: field === 'd' ? val : (selected.size?.d || ''),
                                        }
                                      });
                                    }}
                                    className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-[hsl(220,15%,30%)] bg-[hsl(220,10%,90%)] text-foreground text-sm text-center placeholder:text-[hsl(220,10%,55%)]"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quantity */}
                        {component.needsQuantity && (
                          <div className="flex items-center gap-3">
                            <label className="text-xs text-white whitespace-nowrap">{component.quantityLabel || '수량'}:</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={selected.quantity === 0 ? '' : selected.quantity}
                              onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                update({ quantity: val === '' ? 0 : Math.min(9999, parseInt(val)) });
                              }}
                              onBlur={() => {
                                if (!selected.quantity || selected.quantity < 1) update({ quantity: 1 });
                              }}
                              className="w-20 px-2 py-1.5 rounded-md border border-[hsl(220,15%,30%)] bg-[hsl(220,10%,90%)] text-foreground text-sm text-center"
                            />
                          </div>
                        )}

                        {/* Material */}
                        {component.hasMaterial && component.materialOptions && (
                          <div>
                            <label className="text-xs text-white mb-1 block">재질</label>
                            <div className="flex flex-wrap gap-1.5">
                              {component.materialOptions.map(mat => (
                                <button
                                  key={mat.id}
                                  onClick={() => update({ material: mat.id })}
                                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                                    selected.material === mat.id
                                      ? 'border-primary bg-primary/20 text-primary'
                                      : 'border-[hsl(220,15%,30%)] text-white/70 hover:border-primary/40'
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
                            <label className="text-xs text-[hsl(220,10%,65%)] mb-1 block">후가공</label>
                            <div className="flex flex-wrap gap-1.5">
                              {component.finishingOptions.map(fin => (
                                <button
                                  key={fin.id}
                                  onClick={() => update({ finishing: fin.id })}
                                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                                    selected.finishing === fin.id
                                      ? 'border-primary bg-primary/20 text-primary'
                                      : 'border-[hsl(220,15%,30%)] text-[hsl(220,10%,60%)] hover:border-primary/40'
                                  }`}
                                >
                                  {fin.label}
                                </button>
                              ))}
                            </div>
                            {selected.finishing && component.finishingOptions.find(f => f.id === selected.finishing)?.note && (
                              <p className="text-xs text-amber-500 mt-1">
                                {component.finishingOptions.find(f => f.id === selected.finishing)?.note}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Coating */}
                        {component.hasCoating && (
                          <div>
                            <label className="text-xs text-[hsl(220,10%,65%)] mb-1 block">코팅</label>
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
                                      ? 'border-primary bg-primary/20 text-primary'
                                      : 'border-[hsl(220,15%,30%)] text-[hsl(220,10%,60%)] hover:border-primary/40'
                                  }`}
                                >
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sticker attach */}
                        {component.hasSticker && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.stickerAttach || false}
                              onChange={e => update({ stickerAttach: e.target.checked })}
                              className="rounded border-[hsl(220,15%,30%)]"
                            />
                            <span className="text-xs text-[hsl(220,10%,80%)]">스티커 부착</span>
                          </label>
                        )}

                        {/* Magnet lock */}
                        {showMagnet && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.magnetLock || false}
                              onChange={e => update({ magnetLock: e.target.checked })}
                              className="rounded border-[hsl(220,15%,30%)]"
                            />
                            <span className="text-xs text-[hsl(220,10%,80%)]">자석 여닫이 추가 (+₩3,000)</span>
                          </label>
                        )}

                        {/* Deselect */}
                        <button onClick={onDeselect} className="text-xs text-red-400 hover:text-red-300 hover:underline">선택 해제</button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Component-level notes */}
              {component.notes?.map((note, i) => (
                <p key={i} className="text-xs text-muted-foreground">{note}</p>
              ))}

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
                        type="text"
                        inputMode="numeric"
                        placeholder="단가"
                        value={ci.unitPrice || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          updateCustomItem(ci.id, 'unitPrice', val === '' ? 0 : parseInt(val));
                        }}
                        className="w-24 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm text-right"
                      />
                      <span className="text-xs text-muted-foreground">×</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={ci.quantity === 0 ? '' : ci.quantity}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          updateCustomItem(ci.id, 'quantity', val === '' ? 0 : parseInt(val));
                        }}
                        onBlur={() => {
                          if (!ci.quantity || ci.quantity < 1) updateCustomItem(ci.id, 'quantity', 1);
                        }}
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
