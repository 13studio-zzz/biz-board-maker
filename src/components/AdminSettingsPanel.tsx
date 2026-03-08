import { useState, useEffect } from 'react';
import { type PricingTier, DEFAULT_TIERS, ADMIN_PASSWORD, loadTiers, saveTiers } from '@/lib/pricingConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  onTiersChange: (tiers: PricingTier[]) => void;
}

const AdminSettingsPanel = ({ onTiersChange }: Props) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tiers, setTiers] = useState<PricingTier[]>(loadTiers);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    onTiersChange(tiers);
  }, []);

  const handleUnlock = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setShowPasswordDialog(false);
      setShowSettings(true);
      setPassword('');
      setError('');
    } else {
      setError('비밀번호가 틀렸습니다');
    }
  };

  const handleClickLock = () => {
    if (authenticated) {
      setShowSettings(true);
    } else {
      setShowPasswordDialog(true);
    }
  };

  const handleTierChange = (index: number, field: keyof PricingTier, value: string) => {
    setTiers(prev => {
      const next = [...prev];
      const num = parseFloat(value);
      if (isNaN(num)) return prev;
      next[index] = { ...next[index], [field]: num };
      return next;
    });
  };

  const handleSave = () => {
    saveTiers(tiers);
    onTiersChange(tiers);
    setShowSettings(false);
  };

  const handleReset = () => {
    setTiers(DEFAULT_TIERS.map(t => ({ ...t })));
  };

  return (
    <>
      <button
        onClick={handleClickLock}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto mt-3"
        title="관리자 설정"
      >
        <span className="text-sm">{authenticated ? '🔓' : '🔒'}</span>
        <span>단가 설정</span>
      </button>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-sm">🔒 관리자 인증</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              onClick={handleUnlock}
              className="w-full py-2 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              확인
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">⚙️ 수량 구간별 단가 설정</DialogTitle>
          </DialogHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-1 text-muted-foreground font-medium">수량 구간</th>
                  <th className="text-center py-2 px-1 text-muted-foreground font-medium">재료비 배수</th>
                  <th className="text-center py-2 px-1 text-muted-foreground font-medium">공임비 배수</th>
                  <th className="text-center py-2 px-1 text-muted-foreground font-medium">마진율 (%)</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 px-1 text-card-foreground font-medium">{tier.label}세트</td>
                    <td className="py-2 px-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={tier.volumeDiscount}
                        onChange={e => handleTierChange(i, 'volumeDiscount', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-input bg-background text-foreground text-xs text-center"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={tier.handmadeSurcharge}
                        onChange={e => handleTierChange(i, 'handmadeSurcharge', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-input bg-background text-foreground text-xs text-center"
                      />
                    </td>
                    <td className="py-2 px-1">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={Math.round(tier.marginRate * 100)}
                        onChange={e => handleTierChange(i, 'marginRate', String(parseFloat(e.target.value) / 100))}
                        className="w-full px-2 py-1 rounded border border-input bg-background text-foreground text-xs text-center"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-muted-foreground space-y-1 mt-2">
            <p>• <strong>재료비 배수</strong>: 1.0 = 정가, 0.5 = 50% 할인, 0.18 = 82% 할인</p>
            <p>• <strong>공임비 배수</strong>: 2.5 = 핸드메이드 할증, 1.0 = 기본, 0.2 = 대량생산</p>
            <p>• <strong>마진율</strong>: 최종 견적에 적용되는 이익률</p>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleReset}
              className="flex-1 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              기본값 복원
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              저장
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSettingsPanel;
