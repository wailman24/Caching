## Caching Strategies and Redis Lock Implementation in Product Repository

The `ProductRepositorie` in this project demonstrates **multiple caching strategies** and the use of **Redis locks** to ensure consistency in a high-concurrency environment.

---

### 1. Write-Through Strategy (Create & Update)

**Definition:**  
Write-through caching ensures that **every write goes to both the database and the cache immediately**. This keeps the cache and database **always consistent**.

**Implementation in `CreateProduct` and `UpdateProduct`:**

- **CreateProduct:**

  1. The product is first inserted into the database (`db.Create`).
  2. The cache is immediately updated using `HSet` for the product details and `SAdd` for the list of all product IDs.

- **UpdateProduct:**
  1. Before updating, a **Redis lock** is acquired to prevent simultaneous updates to the same product.
  2. The product is updated in the database (source of truth).
  3. The cache is updated immediately with the new values (`HSet`).

**Why this works:**

- Guarantees strong consistency between DB and cache.
- Slightly slower writes due to writing to two places, but **reads are always fast**.
- The Redis lock ensures **mutual exclusion** when multiple requests try to update the same product at the same time, preventing **race conditions**.

---

### 2. Cache-Aside Strategy (Get Operations)

**Definition:**  
In the cache-aside (lazy loading) pattern, the application **checks the cache first**. If the data is not found (cache miss), it fetches from the database, **populates the cache**, and returns the data.

**Implementation in `GetAllProducts` and `GetProductByID`:**

- **GetProductByID:**

  1. Try to fetch the product from Redis using `HGetAll`.
  2. If the product exists in cache (`Cache HIT`), return it immediately.
  3. If not (`Cache MISS`), fetch from the database and **repopulate the cache** for future requests.

- **GetAllProducts:**
  1. Fetch all product IDs from the Redis set `products:all_ids`.
  2. If the set is empty (`Cache MISS`), fetch all products from the database and **populate both the cache and the set**.
  3. For each ID, call `GetProductByID` to benefit from per-item caching.

**Why this works:**

- Keeps cache and database **loosely coupled**, reducing unnecessary writes to the cache.
- Efficient for reads that may not always require up-to-date data.
- Supports **high read scalability**, as cache hits are served directly from Redis.

---

### 3. Redis Locks in Updates

**Problem without locks:**  
If two requests try to update the same product at the same time:

- Both may update the database simultaneously.
- One update could overwrite the other in the cache.
- Cache could become inconsistent with the database.

**Solution (Implemented in `UpdateProduct`):**

- **Acquire a Redis lock** using `SetNX` with a short expiration (e.g., 5 seconds).
  ```go
  ok, err := pr.cache.SetNX(ctx, lockKey, "1", 5*time.Second).Result()
  If the lock cannot be acquired (`ok == false`), return an error: `"product is being updated, try again"`.
  ```

Perform the database update, then update the cache.

Release the lock using `DEL` after the operation is complete.

### Benefits

- Prevents **race conditions**.
- Avoids **cache stampedes** for frequently updated products.
- Ensures that the cache always reflects the **latest DB state**.

---

### 4. Summary of Strategies Used

| Operation      | Strategy             | Redis Lock | Cache Update Timing         |
| -------------- | -------------------- | ---------- | --------------------------- |
| CreateProduct  | Write-Through        | ❌         | Immediately after DB write  |
| GetProductByID | Cache-Aside          | ❌         | On cache miss               |
| GetAllProducts | Cache-Aside          | ❌         | On cache miss (per product) |
| UpdateProduct  | Write-Through + Lock | ✅         | Immediately after DB write  |

---

> **Takeaway:**  
> This implementation combines **cache-aside** for reads and **write-through with locks** for writes. It ensures **high read performance**, **strong consistency**, and **safe concurrent updates** in a multi-user environment.
