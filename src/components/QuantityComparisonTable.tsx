import { useMemo } from 'react';
import { calculateQuote, type QuoteItem, type CustomItem, type ComponentOption } from '@/lib/pricing';
import { type PricingTier, DEFAULT_TIERS } from '@/lib/pricingConfig';

interface Props {
  quoteItems: QuoteItem[];
  customItems: CustomItem[];
  components: ComponentOption[];
  currentSets: number;
  pricingTiers?: PricingTier[];
}

const COMPARE_QUANTITIES = [1, 10, 100, 500, 1000];

const QuantityComparisonTable = ({ quoteItems, customItems, components, currentSets, pricingTiers = DEFAULT_TIERS }: Props) => {
  const comparisons = useMemo(() => {
    return COMPARE_QUANTITIES.map(sets => {
      const quote = calculateQuote(quoteItems, sets, components, customItems, pricingTiers);
      return { sets, total: quote.total, unitPrice: quote.unitPrice };
    });
  }, [quoteItems, customItems, components, pricingTiers]);

  const formatW = (n: number) => `₩${n.toLocaleString()}`;
  const hasItems = quoteItems.length > 0 || customItems.length > 0;

  if (!hasItems) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-bold text-card-foreground mb-3">📊 수량별 단가 비교</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-xs text-muted-foreground font-medium">수량</th>
              <th className="text-right py-2 text-xs text-muted-foreground font-medium">총 견적가</th>
              <th className="text-right py-2 text-xs text-muted-foreground font-medium">세트당 단가</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map(({ sets, total, unitPrice }) => (
              <tr
                key={sets}
                className={`border-b border-border/50 ${
                  sets === currentSets ? 'bg-primary/10 font-bold' : ''
                }`}
              >
                <td className="py-2 text-card-foreground">
                  {sets.toLocaleString()}세트
                  {sets === currentSets && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#2b2b2b] text-[#c1ff99] font-bold">현재</span>
                  )}
                </td>
                <td className="py-2 text-right text-card-foreground">{formatW(total)}</td>
                <td className="py-2 text-right text-blue-600 font-semibold">{formatW(unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">※ 동일 구성품 기준, VAT 별도</p>
    </div>
  );
};

export default QuantityComparisonTable;
