import React from 'react';
import { useUsage, resetUsage } from '../services/usageTracker';
import { usePricing, setModelPrice } from '../services/pricingStore';
import { Icon } from './Icon';

const formatNumber = (n: number): string => n.toLocaleString('ko-KR');

const formatCost = (n: number): string =>
    n.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

export const UsagePanel: React.FC = () => {
    const usage = useUsage();
    const pricing = usePricing();
    const models = Object.keys(usage.byModel);

    let totalCost = 0;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-fg flex items-center gap-2"><Icon icon="chart-bar" className="w-4 h-4" />이번 세션 사용량 &amp; 예상 비용</h3>
                <button
                    onClick={resetUsage}
                    className="text-xs text-muted hover:text-fg underline"
                    type="button"
                >
                    초기화
                </button>
            </div>
            <p className="text-xs text-faint">
                Google 실제 청구 금액은 API 키만으로 조회할 수 없어, 아래 단가는 직접 입력해야 합니다(Google AI 가격 페이지 참고). 토큰 수는 API 응답에서 그대로 가져온 실측치입니다.
            </p>

            {models.length === 0 ? (
                <p className="text-sm text-faint bg-bg rounded-lg px-3 py-3 text-center">아직 이번 세션에 호출된 모델이 없습니다.</p>
            ) : (
                <div className="space-y-3">
                    {models.map(model => {
                        const stats = usage.byModel[model];
                        const price = pricing[model] ?? { inputPerMillion: 0, outputPerMillion: 0, perImage: 0 };
                        const isImageModel = stats.imageCount > 0;

                        const cost = isImageModel
                            ? stats.imageCount * price.perImage
                            : (stats.promptTokens / 1_000_000) * price.inputPerMillion +
                              (stats.outputTokens / 1_000_000) * price.outputPerMillion;
                        totalCost += cost;

                        return (
                            <div key={model} className="bg-bg rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-mono text-accent">{model}</span>
                                    <span className="text-xs text-faint">호출 {formatNumber(stats.callCount)}회</span>
                                </div>

                                {isImageModel ? (
                                    <>
                                        <p className="text-xs text-muted">생성 이미지 {formatNumber(stats.imageCount)}장</p>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-muted whitespace-nowrap">이미지 1장당 단가</label>
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={price.perImage || ''}
                                                onChange={e => setModelPrice(model, { perImage: Number(e.target.value) || 0 })}
                                                className="w-28 bg-panel border border-strong rounded px-2 py-1 text-fg text-xs"
                                                placeholder="0"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-muted">
                                            입력 {formatNumber(stats.promptTokens)} / 출력 {formatNumber(stats.outputTokens)} / 총 {formatNumber(stats.totalTokens)} 토큰
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <label className="text-xs text-muted whitespace-nowrap">입력 1M 토큰당</label>
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={price.inputPerMillion || ''}
                                                onChange={e => setModelPrice(model, { inputPerMillion: Number(e.target.value) || 0 })}
                                                className="w-24 bg-panel border border-strong rounded px-2 py-1 text-fg text-xs"
                                                placeholder="0"
                                            />
                                            <label className="text-xs text-muted whitespace-nowrap">출력 1M 토큰당</label>
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={price.outputPerMillion || ''}
                                                onChange={e => setModelPrice(model, { outputPerMillion: Number(e.target.value) || 0 })}
                                                className="w-24 bg-panel border border-strong rounded px-2 py-1 text-fg text-xs"
                                                placeholder="0"
                                            />
                                        </div>
                                    </>
                                )}

                                <p className="text-right text-sm text-accent font-semibold">예상 비용: {formatCost(cost)}</p>
                            </div>
                        );
                    })}

                    <div className="flex justify-between items-center pt-2 border-t border-line">
                        <span className="text-sm font-semibold text-fg">세션 전체 예상 비용</span>
                        <span className="text-lg font-bold text-accent">{formatCost(totalCost)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
