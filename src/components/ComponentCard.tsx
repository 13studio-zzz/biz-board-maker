import { motion } from 'framer-motion';
import type { ComponentOption, SubOption } from '@/lib/pricing';

interface Props {
  component: ComponentOption;
  selected: { optionId: string; quantity: number } | null;
  onSelect: (optionId: string, quantity: number) => void;
  onDeselect: () => void;
}

const ComponentCard = ({ component, selected, onSelect, onDeselect }: Props) => {
  const needsQuantity = ['cards', 'money', 'token', 'dice', 'meeple'].includes(component.id);

  const handleOptionClick = (opt: SubOption) => {
    if (selected?.optionId === opt.id) {
      onDeselect();
    } else {
      const defaultQty = component.id === 'cards' ? 54 : component.id === 'money' ? 60 : component.id === 'token' ? 20 : component.id === 'dice' ? 2 : component.id === 'meeple' ? 4 : 1;
      onSelect(opt.id, needsQuantity ? defaultQty : 1);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{component.icon}</span>
          <div>
            <h3 className="font-semibold text-card-foreground">{component.name}</h3>
            <p className="text-xs text-muted-foreground">{component.description}</p>
          </div>
        </div>
        {selected && (
          <button onClick={onDeselect} className="text-xs text-destructive hover:underline">제외</button>
        )}
      </div>

      <div className="grid gap-2">
        {component.options.map(opt => {
          const isActive = selected?.optionId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleOptionClick(opt)}
              className={`text-left p-3 rounded-lg border transition-all text-sm ${
                isActive
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border hover:border-primary/40 hover:bg-secondary/50'
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
      </div>

      {selected && needsQuantity && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 flex items-center gap-3 pt-3 border-t border-border"
        >
          <label className="text-sm text-muted-foreground whitespace-nowrap">
            {component.id === 'cards' ? '카드 장수' : component.id === 'money' ? '지폐 장수' : component.id === 'token' ? '토큰 개수' : component.id === 'dice' ? '주사위 개수' : '말 개수'}:
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={selected.quantity}
            onChange={e => onSelect(selected.optionId, Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-2 py-1 rounded-md border border-input bg-background text-foreground text-sm text-center"
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default ComponentCard;
