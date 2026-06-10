/**
 * 基于 Mulberry32 算法的伪随机数生成器 (PRNG)
 * 作用：保证在相同 Seed 下，所有平台的生成结果完全一致。
 */
export class Random {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * 生成下一个随机数 [0, 1)
     */
    public next(): number {
        this.seed |= 0;
        this.seed = this.seed + 0x6D2B79F5 | 0;
        let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * 返回指定范围内的整数 [min, max]
     */
    public rangeInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * 随机打乱数组 (Fisher-Yates 洗牌算法)
     */
    public shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.rangeInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}
