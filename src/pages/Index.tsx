import { useState, useMemo, useEffect } from 'react';
import ComponentCard from '@/components/ComponentCard';
import QuoteSummary from '@/components/QuoteSummary';
import QuantityComparisonTable from '@/components/QuantityComparisonTable';
import AdminSettingsPanel from '@/components/AdminSettingsPanel';
import type { ImportedQuoteData } from '@/components/QuoteSummary';
import { BOARD_GAME_COMPONENTS, calculateQuote, type QuoteItem, type CustomItem, type Selection } from '@/lib/pricing';
import { type PricingTier, loadTiers } from '@/lib/pricingConfig';

const QUANTITY_PRESETS = [1, 3, 5, 10, 30, 50, 100, 300, 500, 1000];

const Index = () => {
  const [sets, setSets] = useState(1);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(loadTiers);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [enabledComponents, setEnabledComponents] = useState<Record<string, boolean>>(
    () => Object.fromEntries(BOARD_GAME_COMPONENTS.map(c => [c.id, c.id === 'cards']))
  );
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [customItemsMap, setCustomItemsMap] = useState<Record<string, CustomItem[]>>({});

  // Expose state for JSON export
  useEffect(() => {
    (window as any).__quoteSelections = selections;
    (window as any).__quoteCustomItems = customItemsMap;
  }, [selections, customItemsMap]);

  const handleSelect = (compId: string, sel: Partial<Selection>) => {
    setSelections(prev => ({
      ...prev,
      [compId]: { ...prev[compId], ...sel } as Selection,
    }));
  };

  const handleDeselect = (compId: string) => {
    setSelections(prev => {
      const next = { ...prev };
      delete next[compId];
      return next;
    });
  };

  const handleCustomItems = (compId: string, items: CustomItem[]) => {
    setCustomItemsMap(prev => ({ ...prev, [compId]: items }));
  };

  const handleImportQuote = (data: ImportedQuoteData) => {
    setProjectName(data.projectName);
    setClientName(data.clientName);
    setSets(data.sets);
    setSelections(data.selections as Record<string, Selection>);
    setCustomItemsMap(data.customItemsMap as Record<string, CustomItem[]>);
  };

  const quoteItems: QuoteItem[] = useMemo(() =>
    Object.entries(selections).map(([componentId, sel]) => ({
      componentId,
      optionId: sel.optionId,
      quantity: sel.quantity,
      size: sel.size,
      coating: sel.coating,
      material: sel.material,
      finishing: sel.finishing,
      magnetLock: sel.magnetLock,
      stickerAttach: sel.stickerAttach,
    })),
    [selections]
  );

  const allCustomItems = useMemo(() =>
    Object.values(customItemsMap).flat().filter(ci => ci.name && ci.unitPrice > 0),
    [customItemsMap]
  );

  const quote = useMemo(() =>
    calculateQuote(quoteItems, sets, BOARD_GAME_COMPONENTS, allCustomItems),
    [quoteItems, sets, allCustomItems]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">🎲 보드게임 주문제작 견적 시스템</h1>
            <p className="text-xs text-muted-foreground">구성품과 수량을 선택하면 실시간 견적이 산출됩니다</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-5 flex-1 w-full">
        {/* 프로젝트 정보 + 수량 */}
        <div className="mb-5 p-4 rounded-lg border border-border bg-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">프로젝트명</label>
              <input
                type="text"
                placeholder="예: 마법사의 탑"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">고객명</label>
              <input
                type="text"
                placeholder="예: 홍길동"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-xs font-medium text-muted-foreground">제작 수량</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={sets}
                  onChange={e => setSets(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
                  className="w-20 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-sm text-center font-semibold"
                />
                <span className="text-sm text-muted-foreground">세트</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUANTITY_PRESETS.map(q => (
                <button
                  key={q}
                  onClick={() => setSets(q)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                    sets === q
                      ? 'bg-[#2b2b2b] text-[#c1ff99] border-[#2b2b2b] font-bold'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent border-border'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {sets <= 10 ? '🔧 소량: 완전 핸드메이드 공정' :
                sets <= 100 ? '⚙️ 중량: 반자동 공정 적용' :
                '🏭 대량: 소규모 양산 체계'}
            </p>
          </div>
        </div>

        {/* 구성품 체크리스트 */}
        <div className="mb-5 p-4 rounded-lg border border-border bg-card">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">구성품 체크리스트</label>
          <div className="flex flex-wrap gap-2">
            {BOARD_GAME_COMPONENTS.map(comp => {
              const checked = enabledComponents[comp.id] ?? true;
              return (
                <button
                  key={comp.id}
                  onClick={() => {
                    setEnabledComponents(prev => ({ ...prev, [comp.id]: !prev[comp.id] }));
                    if (checked) handleDeselect(comp.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                    checked
                      ? 'bg-[#2b2b2b] text-[#c1ff99] border-[#2b2b2b]'
                      : 'bg-muted text-muted-foreground border-border opacity-60'
                  }`}
                >
                  <span>{comp.icon}</span>
                  <span>{comp.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-4">
            <h2 className="font-bold text-foreground text-sm mb-2">구성품 선택</h2>
            {BOARD_GAME_COMPONENTS.filter(comp => enabledComponents[comp.id] ?? true).map((comp) => (
              <ComponentCard
                key={comp.id}
                component={comp}
                selected={selections[comp.id] || null}
                onSelect={(sel) => handleSelect(comp.id, sel)}
                onDeselect={() => handleDeselect(comp.id)}
                customItems={customItemsMap[comp.id] || []}
                onCustomItemsChange={comp.allowCustom ? (items) => handleCustomItems(comp.id, items) : undefined}
              />
            ))}
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-4 pr-1">
              <QuoteSummary
                quote={quote}
                sets={sets}
                projectName={projectName}
                clientName={clientName}
                onImportQuote={handleImportQuote}
              />
              <QuantityComparisonTable
                quoteItems={quoteItems}
                customItems={allCustomItems}
                components={BOARD_GAME_COMPONENTS}
                currentSets={sets}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card mt-20">
        <div className="max-w-7xl mx-auto px-6 py-10 text-center space-y-1">
          <p className="text-xs text-muted-foreground">본 견적은 참고용이며, 최종 가격은 상담 후 확정됩니다.</p>
          <p className="text-xs text-muted-foreground">모든 가격은 VAT 별도</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;