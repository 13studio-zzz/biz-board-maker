import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ComponentCard from '@/components/ComponentCard';
import QuoteSummary from '@/components/QuoteSummary';
import { BOARD_GAME_COMPONENTS, calculateQuote, type QuoteItem } from '@/lib/pricing';

const QUANTITY_PRESETS = [1, 3, 5, 10, 30, 50, 100, 300, 500, 1000];

const Index = () => {
  const [sets, setSets] = useState(10);
  const [selections, setSelections] = useState<Record<string, { optionId: string; quantity: number }>>({});

  const handleSelect = (compId: string, optionId: string, quantity: number) => {
    setSelections(prev => ({ ...prev, [compId]: { optionId, quantity } }));
  };

  const handleDeselect = (compId: string) => {
    setSelections(prev => {
      const next = { ...prev };
      delete next[compId];
      return next;
    });
  };

  const quoteItems: QuoteItem[] = useMemo(() =>
    Object.entries(selections).map(([componentId, sel]) => ({
      componentId,
      optionId: sel.optionId,
      quantity: sel.quantity,
    })),
    [selections]
  );

  const quote = useMemo(() =>
    calculateQuote(quoteItems, sets, BOARD_GAME_COMPONENTS),
    [quoteItems, sets]
  );

  return (
    <div className="min-h-screen bg-background craft-texture">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              🎲 보드게임 주문제작 견적
            </h1>
            <p className="text-xs text-muted-foreground">구성품을 선택하고 수량을 지정하면 실시간 견적이 산출됩니다</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 수량 선택 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-xl border border-border bg-card shadow-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-semibold text-card-foreground">제작 수량</h2>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={1000}
                value={sets}
                onChange={e => setSets(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                className="w-20 px-2 py-1 rounded-md border border-input bg-background text-foreground text-sm text-center font-semibold"
              />
              <span className="text-sm text-muted-foreground">세트</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUANTITY_PRESETS.map(q => (
              <button
                key={q}
                onClick={() => setSets(q)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  sets === q
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
                }`}
              >
                {q}세트
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {sets <= 10 ? '🔧 소량 제작: 완전 핸드메이드 공정. 공임비 비중이 높으나 금형비 없이 제작 가능.' :
             sets <= 100 ? '⚙️ 중량 제작: 반자동 공정 적용. 일부 공정은 기계화하여 단가 절감.' :
             '🏭 대량 제작: 소규모 양산 체계. 금형/판 제작으로 단가 대폭 절감.'}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 구성품 선택 */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-bold text-foreground text-lg">구성품 선택</h2>
            {BOARD_GAME_COMPONENTS.map((comp, i) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ComponentCard
                  component={comp}
                  selected={selections[comp.id] || null}
                  onSelect={(optId, qty) => handleSelect(comp.id, optId, qty)}
                  onDeselect={() => handleDeselect(comp.id)}
                />
              </motion.div>
            ))}
          </div>

          {/* 견적 요약 */}
          <div className="lg:col-span-1">
            <QuoteSummary quote={quote} sets={sets} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
