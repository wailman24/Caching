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
   * Retrieves a data point from the cache
   * @emits "miss" Indicates that a cache miss happened
   * @emits "get" Indicates that a cache hit happened
   * @param key Key of the data to retrieve
   */
  public get(key: string | number) {
    const found = this.data.get(key);
    if (found && this._checkData(key, found)) {
      this.stats.hits++;
      found.numberOfAccess++;
      found.lastAccessTimeStamp = Date.now();
      this.emit("get", key, found);
      return this._unwrap(found);
    } else {
      this.stats.misses++;
      this.emit("miss", key);
      return undefined;
    }
  }

  /**
   * Method to get many keys at once
   * @emits "miss" Indicates that a cache miss happened
   * @emits "get" Indicates that a cache hit happened
   * @param keys Array of keys
   * @returns
   */
  public many_get(keys: (string | number)[]) {
    let all_found: {
      [key: string | number]: T;
    } = {};

    for (const key of keys) {
      const found = this.data.get(key);
      if (found && this._checkData(key, found)) {
        this.stats.hits++;
        found.numberOfAccess++;
        found.lastAccessTimeStamp = Date.now();
        all_found[key] = this._unwrap(found);
        this.emit("get", key, found);
      } else {
        this.stats.misses++;
        this.emit("miss", key);
      }
    }

    return all_found;
  }

  /**
   * Function to set a certain key in the cache.
   * @param key   Key of the data to be set.
   * @param data  The data to be entered into the cache.
   * @param ttl   The TTL of the new data point, will be ignored if the invalidation policy isn't set to TTL
   * @emits "set" Indicates that the data has been set successfully
   * @returns
   */
  public set(key: string | number, data: T, ttl?: number) {
    this._checkAndEvict();

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
   * Function to add multiple data points to the cache
   * @param keyValueSet All of the keys that will be added, optional ttl argument will be ignored if not in TTL invalidation mode.
   * @emits "set" Indicates that a value has been set correctly.
   */
  public many_set(keyValueSet: {
    [key: string | number]: {
      ttl?: number;
      data: T;
    };
  }) {
    this._checkAndEvict(Object.keys(keyValueSet).length);

    for (const keyValuePair of Object.entries(keyValueSet)) {
      const [key, { ttl, data }] = keyValuePair;
      this.set(key, data, ttl);
      this.emit("set", key, data);
    }
  }

  /**
   * Function to get a key while removing it from the cache
   * @param key Key to be taken out of the cache
   * @returns value that was stored to that key
   */
  public take(key: string | number) {
    const found = this.get(key);
    if (found) {
      this.del([key]);
    }
    return found;
  }

  /**
   * Function to check if a key is present in the cache
   * @param key key for the lookup
   * @returns a boolean value specifying if the value is present.
   */
  public has(key: string | number) {
    const found = this.data.get(key);
    return found && this._checkData(key, found);
  }

  /**
   * Function to delete a certain set of keys from the cache
   * @emits "del" Indicates that the data has been deleted successfully
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
   * Function to change the TTL of a given key in TTL mode
   * @param key key to be changed
   * @param newTTL the new TTL that will be assigned, if less than 0 key will be deleted.
   * @returns boolean value representing if the change was successful
   */
  public ttl(key: string | number, newTTL?: number) {
    if (this.options.invalidationPolicy !== "TTL") return false;

    if (!newTTL) {
      newTTL = this.options.stdTTL;
    }

    const found = this.data.get(key);
    if (found && this._checkData(key, found)) {
      if (newTTL >= 0) {
        this.data.set(key, this._wrap(found.value, newTTL, false));
      } else {
        this.del([key]);
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   * Function to get metadata about the key, such as TTL, time since last accessed, number of accesses
   * @param key key for the lookup
   * @returns metadata information about the key.
   */
  public getMeta(key: string | number) {
    const found = this.data.get(key);

    if (found && this._checkData(key, found)) {
      return {
        lastAccessTime: found.lastAccessTimeStamp,
        numberOfAccesses: found.numberOfAccess,
        ttl: found.ttl,
      };
    }
  }

  /**
   * Function to get the data of the cache
   * @returns the statistics of the cache
   */
  public getStats() {
    return this.stats;
  }

  /**
   *  Function to flush all the data and the statistics of the cache
   */
  public flushAll() {
    this.data = new Map();
    this.stats = {
      keys: 0,
      vsize: 0,
      ksize: 0,
      hits: 0,
      misses: 0,
    };
  }

  /**
   * Function to flush the statistics of the cache
   */
  public flushStats() {
    this.stats = {
      keys: 0,
      vsize: 0,
      ksize: 0,
      hits: 0,
      misses: 0,
    };
  }

  /**
   * This function will evict a data point based on the set options
   * @param numberOfEvictions number of keys that will get evicted, defaults to 1
   */
  private _evictData(numberOfEvictions: number = 1) {}

  /**
   * Internal function to check if the cache is full, if so evict data according to the eviction policy
   * @param [padding=0] How big the empty space should be.
   */
  private _checkAndEvict(padding: number = 0) {
    if (
      this.options.maxKeys > -1 &&
      this.stats.keys + padding >= this.options.maxKeys
    ) {
      this._evictData(padding);
    }
  }

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
   * @emits "expired" Indicates that some data has been invalidated.
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

    if (asClone) return clone(data.value);
    else return data.value;
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
