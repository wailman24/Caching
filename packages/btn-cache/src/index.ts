import EventEmitter from "events";

type BaseCacheOptions = {
  evictionPolicy: "LRU" | "LFU" | "FIFO" | "RANDOM";
  deleteOnExpire?: boolean;
  maxKeys?: number;
};

type invalidationPolicyOptions =
  | {
      invalidationPolicy: "NONE";
    }
  | {
      invalidationPolicy: "TTL";
      stdTTL: number;
    }
  | {
      invalidationPolicy: "EVENT";
      predicate: (state: BTNCache) => boolean;
    };

export type CacheOptions = BaseCacheOptions & invalidationPolicyOptions;

export type CacheOptionsInput = Partial<BaseCacheOptions> &
  (
    | {
        invalidationPolicy?: "NONE";
      }
    | {
        invalidationPolicy?: "TTL";
        stdTTL?: number;
      }
    | {
        invalidationPolicy?: "EVENT";
        predicate?: (state: BTNCache) => boolean;
      }
  );

export type CacheStats = {
  hits: number;
  misses: number;
  ksize: number;
  vsize: number;
};

const DEFAULT_OPTIONS: CacheOptions = {
  evictionPolicy: "RANDOM",
  deleteOnExpire: true,
  maxKeys: -1,
  invalidationPolicy: "TTL",
  stdTTL: 500,
};

export class BTNCache<T = any> extends EventEmitter {
  private data = new Map<string | number, T>();
  private options: CacheOptions;
  private stats: CacheStats;

  constructor(options: CacheOptionsInput = {}) {
    super();

    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as CacheOptions;

    if (
      this.options.invalidationPolicy == "EVENT" &&
      typeof this.options.predicate !== "function"
    ) {
      throw new Error("EVENT invalidation requires a predicate");
    }

    this.stats = {
      hits: 0,
      misses: 0,
      ksize: 0,
      vsize: 0,
    };
  }
}
