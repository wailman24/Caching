import EventEmitter from "events";
import clone from "clone";

type BaseCacheOptions = {
  evictionPolicy: "LRU" | "LFU" | "FIFO" | "RANDOM";
  deleteOnExpire: boolean;
  maxKeys: number;
  useClones: boolean;
};

type invalidationPolicyOptions<T> =
  | {
      invalidationPolicy: "NONE";
    }
  | {
      invalidationPolicy: "TTL";
      stdTTL: number;
    }
  | {
      invalidationPolicy: "EVENT";
      predicate: (data: StoredData<T>) => boolean;
    };

export type CacheOptions<T> = BaseCacheOptions & invalidationPolicyOptions<T>;

export type CacheOptionsInput<T> = Partial<BaseCacheOptions> &
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
        predicate?: (data: StoredData<T>) => boolean;
      }
  );

export type CacheStats = {
  keys: number;
  hits: number;
  misses: number;
  ksize: number;
  vsize: number;
};

export type StoredData<T> = {
  value: T;
  ttl?: number;
  numberOfAccess: number;
  lastAccessTimeStamp: number;
};

const DEFAULT_OPTIONS: CacheOptions<unknown> = {
  evictionPolicy: "RANDOM",
  deleteOnExpire: true,
  maxKeys: -1,
  invalidationPolicy: "TTL",
  stdTTL: 500,
  useClones: true,
};

export class BTNCache<T = any> extends EventEmitter {
  private data = new Map<string | number, StoredData<T>>();
  private options: CacheOptions<T>;
  private stats: CacheStats;

  constructor(options: CacheOptionsInput<T> = {}) {
    super();

    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as CacheOptions<T>;

    if (
      this.options.invalidationPolicy == "EVENT" &&
      typeof this.options.predicate !== "function"
    ) {
      throw new Error("EVENT invalidation requires a predicate");
    }

    this.stats = {
      keys: 0,
      hits: 0,
      misses: 0,
      ksize: 0,
      vsize: 0,
    };
  }

  /**
   * Retrieves a data point from the cache, emits a "miss" event on a cache miss
   * @param key Key of the data to retrieve
   */
  public get(key: string | number) {
    const found = this.data.get(key);
    if (found && this._checkData(key, found)) {
      this.stats.hits++;
      found.numberOfAccess++;
      found.lastAccessTimeStamp = Date.now();
      this.emit("get", key, found);
      return found;
    } else {
      this.stats.misses++;
      this.emit("miss", key);
      return undefined;
    }
  }

  /**
   * Function to set a certain key in the cache.
   * @param key   Key of the data to be set.
   * @param data  The data to be entered into the cache.
   * @param ttl   The TTL of the new data point, will be ignored if the invalidation policy isn't set to TTL
   * @returns
   */
  public set(key: string | number, data: T, ttl?: number) {
    if (this.options.maxKeys > -1 && this.stats.keys >= this.options.maxKeys) {
      this._evictData();
    }

    if (this.options.invalidationPolicy == "TTL" && !ttl) {
      ttl = this.options.stdTTL;
    }

    let existent = false;

    if (this.data.has(key)) {
      existent = true;
      this.stats.vsize -= this._getDataLength(data);
    }

    this.data.set(key, this._wrap(data, ttl));
    this.stats.vsize += this._getDataLength(data);

    if (!existent) {
      this.stats.ksize += this._getDataLength(key);
      this.stats.keys++;
    }

    this.emit("set", key, data);

    return true;
  }

  /**
   * Function to delete a certain set of keys from the cache, emits a "del" event after each deletion with the deleted value.
   * @param keys The array of keys to be deleted.
   * @returns Number of elements deleted from the cache.
   */
  public del(keys: (string | number)[]) {
    let delCount = 0;
    for (const key of keys) {
      if (this.data.has(key)) {
        const found = this.data.get(key);
        this.stats.vsize -= this._getDataLength(found);
        this.stats.ksize -= this._getDataLength(key);
        this.stats.keys--;
        delCount++;
        this.data.delete(key);
        this.emit("del", key, found?.value);
      }
    }

    return delCount;
  }

  /**
   * This function will evict a data point based on the set options
   */
  private _evictData() {}

  /**
   * Internal method to roughly calculate the size of the value
   * @param value Value to process its size
   */
  private _getDataLength(value: unknown) {
    if (typeof value === "string") {
      return value.length;
    } else if (typeof value === "number") {
      return 8;
    } else {
      return JSON.stringify(value).length;
    }
  }

  /**
   * Internal method to check if a data point is invalidated or not.
   * @param key   The key of the checked data
   * @param data  The Stored data
   * @returns If the data is invalidated or not
   */
  private _checkData(key: string | number, data: StoredData<T>) {
    let returnValue: boolean = true;

    const deleteAndEmit = () => {
      if (this.options.deleteOnExpire) {
        returnValue = false;
        this.del([key]);
      }
      this.emit("expired", key, data);
    };

    if (this.options.invalidationPolicy === "TTL") {
      if (data.ttl && data.ttl < Date.now()) {
        deleteAndEmit();
      }
    } else if (this.options.invalidationPolicy === "EVENT") {
      const predicateResult = this.options.predicate(data);
      if (!predicateResult) {
        deleteAndEmit();
      }
    }

    return returnValue;
  }

  /**
   * Internal method to standardize the returns of getters.
   * @param data The data to be unwrapped
   * @param asClone Option if to return a copy of the data or a reference
   */
  private _unwrap(data: StoredData<T>, asClone: boolean = true) {
    if (!this.options.useClones) {
      asClone = false;
    }

    if (data.value) {
      if (asClone) return clone(data.value);
      else return data.value;
    }

    return null;
  }

  /**
   * Internal method to wrap any value into the stored value type.
   * @param value     Value that will be wrapped
   * @param ttl       Time to live, will be ignored if the invalidation policy is not set to "TTL"
   * @param asClone   If the wrapped value is a clone or a reference to the original
   */
  private _wrap(value: T, ttl?: number, asClone: boolean = true) {
    if (!this.options.useClones) {
      asClone = false;
    }

    const now = Date.now();

    let lifetime = -1;
    if (this.options.invalidationPolicy === "TTL") {
      const TTLMultiplication = 1000;
      if (ttl == 0) {
        lifetime = 0;
      } else if (ttl) {
        lifetime = now + ttl * TTLMultiplication;
      } else {
        if (this.options.stdTTL == 0) {
          lifetime = 0;
        } else {
          lifetime = now + this.options.stdTTL * TTLMultiplication;
        }
      }
    }

    const returned: StoredData<T> = {
      value: asClone ? clone(value) : value,
      ttl: lifetime,
      numberOfAccess: 0,
      lastAccessTimeStamp: now,
    };

    return returned;
  }
}
