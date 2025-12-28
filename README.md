## What is caching ?

In order to shorten the time it takes to access **frequently accessed data** in the future, **caching** is a technique used to store that data in a **fast storage layer**. Due to **network latency, I/O operations, or computational complexity**, direct data retrieval from databases or external services can be slow in contemporary applications. Applications can react to **repeated requests** faster by keeping a **copy of this data** in a cache.

A good metaphor for **caching** would be to imagine a **notepad** where you keep key details rather than **digging through the archives** every time you need them. This way you spend **less time searching** for the information.

---

## Types of Caches

The idea is straightforward, but how it is put into practice depends on who needs **access to the data** and where it is **kept**.

Here are a few examples of caching types:

### 1. In-Memory Cache

Data is directly **stored in the RAM** of a server or application process by in-memory caches. This enables **extremely fast** access times, which are frequently expressed in microseconds. RAM data is volatile and will be lost if the process restarts. For data that is frequently read but
**does not** need **long-term persistence**, in-memory caches work best.

**Use Cases:** Session storage, configuration settings, computed results, frequently accessed product data.

### 2. Distributed Cache

**Distributed caches** are appropriate for **scalable applications** where multiple instances of a service must **share the same cached data** because they span **multiple servers or nodes**. Redis and Memcached are two examples.

**Use Cases:** Large-scale e-commerce sites, social media feeds, or multi-server web applications.

### 3. Client-Side Cache

Data is stored on the user's device, such as in a mobile application or browser, as part of client-side caching. For frequent accesses, this lowers network calls and boosts performance.

**Use Cases:** Storing API responses, static assets, user preferences.

---

## Benefits of Caching

Caching is not just about speed. It also improves system efficiency, reduces costs, and enhances user experience.

- **Lower Latency:** Accessing data from cache is faster than hitting a database or external service.
- **Reduced Backend Load:** Fewer database queries reduce server strain.
- **Cost Savings:** Reduced computation and I/O lowers infrastructure costs.
- **Enhanced User Experience:** Users get faster responses and smoother interactions.

---

## In-Memory Caching in Depth

In-memory caching stores data directly in RAM, which makes it the fastest type of caching available. Accessing data from memory is significantly quicker than reading from a database or disk, often measured in microseconds. This makes in-memory caching ideal for applications that frequently read the same data, such as popular product details, session information, or computed results.

However, because memory is limited, careful management is necessary to ensure efficiency and reliability.

**Key Considerations:**

1. **Volatility:**  
   Data stored in memory is temporary. If the server restarts or crashes, all cached data is lost. It's important to have mechanisms to repopulate the cache when needed.

2. **Memory Limit:**  
   RAM is a finite resource. You need to carefully size your cache and choose appropriate eviction policies to ensure that the most important data remains accessible while less critical data is removed.

3. **Consistency:**  
   Cached data can become outdated if the original data changes. Strategies such as cache invalidation, TTL (Time to Live), or write-through/write-behind policies help maintain consistency between the cache and the underlying database.

---

## Caching Strategies Explained

### Cache-Aside (Lazy Loading)

In the cache-aside pattern, the application is responsible for reading and writing from/to the cache. When a request arrives:

1. Check the cache.
2. If present (cache hit), return the data.
3. If absent (cache miss), fetch from the database, store it in the cache, then return it.

This approach keeps cache and database loosely coupled, but the application must handle cache population and invalidation.

```mermaid
flowchart TD;
A[Application Request] --> B{Check Cache}
B -- Hit --> C[Return Data from Cache]
B -- Miss --> D[Fetch Data from Database]
D --> E[Store Data in Cache]
E --> F[Return Data to Application]
```

### Read-Through

The cache acts as a mediator between the application and the database. On a cache miss, it automatically loads data from the database, stores it in the cache, and returns it. This centralizes cache management, reducing application complexity.

```mermaid
flowchart TD
    A[Application Request] --> B[Cache]
    B -- Hit --> C[Return Data to Application]
    B -- Miss --> D[Cache Fetches Data from Database]
    D --> B[Store Data in Cache]
    B --> C[Return Data to Application]
```

### Write-Through

With write-through caching, all writes go to both the cache and the database synchronously. This guarantees strong consistency because the cache and database always reflect the same data. The trade-off is slightly slower write operations.

```mermaid
flowchart TD
    A[Application Write Request] --> B[Write to Cache]
    B --> C[Write to Database]
    C --> D[Confirmation to Application]
```

### Write-Behind (Write-Back)

Write-behind caching allows applications to write data to the cache first and asynchronously update the database later. This improves write performance but introduces potential data loss if the cache fails before writing to the database. Proper monitoring and retry mechanisms are essential.

```mermaid
flowchart TD
    A[Application Write Request] --> B[Write to Cache]
    B --> C[Return Confirmation to Application]
    B --> D[Asynchronously Write to Database]
```

---

## Eviction Policies

When the cache reaches its maximum capacity, it cannot store new data without removing some existing entries. **Eviction policies** define which items get removed to make space. Choosing the right policy ensures that the cache continues to provide fast access to the most useful data.

### 1. Least Recently Used (LRU)

- **Description:** Removes the item that has not been accessed for the longest time.
- **Assumption:** Data used recently will likely be used again soon.
- **Example:** In a cache of 3 items `[A, B, C]`, if `A` was used long ago, it will be evicted first when adding a new item `D`.

### 2. Least Frequently Used (LFU)

- **Description:** Removes the item that is accessed the fewest times.
- **Assumption:** Data that is rarely accessed is less valuable.
- **Example:** If item `B` has been accessed only once while `A` and `C` were accessed 5 times, `B` will be evicted first when the cache is full.

### 3. First In, First Out (FIFO)

- **Description:** Removes the oldest item in the cache.
- **Assumption:** Older data is less relevant than newer data.
- **Example:** In `[A, B, C]`, `A` was added first, so `A` is removed when adding `D`.

### 4. Random Eviction

- **Description:** Removes a random cache entry.
- **Notes:** Simple but sometimes effective if access patterns are unpredictable.

---

## Metrics and Monitoring

To know if a cache is working well, we need to track some important numbers. Here’s what they mean and how to measure them:

- **Cache Hit Rate:**

  - **What it is:** Percentage of requests answered directly from the cache. Higher is better.
  - **How to measure:** Count the number of cache hits ÷ total requests × 100.
    ```text
    Cache Hit Rate = (Cache Hits / Total Requests) * 100%
    ```

- **Cache Miss Rate:**

  - **What it is:** Percentage of requests that are not in the cache and must be fetched from the database. Lower is better.
  - **How to measure:** Count the number of cache misses ÷ total requests × 100.
    ```text
    Cache Miss Rate = (Cache Misses / Total Requests) * 100%
    ```

- **Eviction Rate:**

  - **What it is:** How often items are removed from the cache to make space.
  - **How to measure:** Count the number of evicted items over a period of time.
    ```text
    Eviction Rate = (Number of Evictions / Time Period)
    ```

- **Data Freshness:**
  - **What it is:** How up-to-date the cached data is, so users don’t see old information.
  - **How to measure:** Track the age of items in the cache (current time − last updated time).
    ```text
    Data Age = Current Time - Last Updated Time
    ```

> Most caching systems like Redis, Memcached, or in-memory libraries provide built-in stats or commands to get these metrics easily.

---

## Redis Locks (Distributed Locks)

When multiple processes or servers access and update the **same cached data** concurrently, there is a risk of **race conditions**, **cache stampedes**, or inconsistent data. **Redis locks** help prevent these issues by providing a **mechanism to coordinate access** to shared resources in a distributed environment.

### What is a Redis Lock?

A Redis lock is a **temporary marker in Redis** that indicates a resource is currently being used or updated. Only the process that holds the lock can modify the resource, ensuring **mutual exclusion**. Other processes must wait until the lock is released.

**Example Use Case:**

Imagine a popular product page is frequently accessed, and the cache expires at the same time. Without a lock:

1. Multiple requests hit the database simultaneously (cache miss).
2. Database overload occurs.
3. Users experience slower responses.

With a Redis lock:

1. The first request acquires the lock and updates the cache.
2. Other requests wait until the lock is released.
3. Once the cache is updated, all requests are served from cache, preventing a stampede.

### How Redis Locks Work

1. **Acquire Lock:**  
   The process tries to set a key in Redis (e.g., `SETNX product:123:lock 1`).

   - **SETNX** (Set if Not eXists) ensures only one process can acquire the lock.

2. **Perform Operation:**  
   The process safely reads/writes data (e.g., fetches from DB, updates cache).

3. **Release Lock:**  
   After completing the operation, the lock is removed (`DEL product:123:lock`), allowing other processes to acquire it.

### Key Considerations

- **Expiration:** Always set a lock expiration time to avoid deadlocks if a process crashes while holding the lock.  
  Example: `SET product:123:lock 1 NX PX 5000` (lock expires in 5 seconds)
- **Retry Mechanism:** Other processes can retry acquiring the lock after a short delay.
- **Distributed Systems:** Redis locks work well for multiple servers or instances accessing the same cache.

### Summary

Redis locks are a simple yet powerful way to:

- Prevent **race conditions** in caching.
- Avoid **cache stampedes** on high-traffic resources.
- Ensure **data consistency** across distributed systems.

> Think of it as **reserving the notepad** while one person writes on it so others don’t overwrite the data simultaneously.

---

## Example Scenarios of In-Memory Caching

### 1. E-Commerce Website

In an online store, certain products are extremely popular and frequently viewed by users. Fetching product details, prices, and availability from the database every time a user visits the page can slow down the website and put heavy load on the server. By using in-memory caching, these frequently requested items can be stored in RAM, allowing the website to serve them almost instantly.  
**Benefits:**

- Faster page loads for users browsing popular products.
- Reduced database queries, improving scalability.
- Ability to handle traffic spikes during promotions or sales.

---

### 2. Mobile Application

Mobile apps often rely on APIs to fetch user-specific data, like profile information, preferences, or notifications. Every network request consumes bandwidth and may introduce latency. By caching user session data and recently fetched API responses locally on the device or in a memory layer, the app can respond immediately to repeated requests without contacting the server every time.  
**Benefits:**

- Improved app responsiveness and smoother user experience.
- Reduced network calls, saving data usage and battery.
- Ability to work offline or in low-connectivity scenarios with cached data.

---

### 3. Analytics Platform

Dashboards in analytics platforms often display complex computations, such as aggregated metrics, charts, and reports. Calculating these metrics on-the-fly for every user request can be slow and resource-intensive. By caching computed results in memory, the platform can instantly serve dashboards to users while still updating cached values periodically as new data arrives.  
**Benefits:**

- Real-time or near real-time dashboard updates.
- Reduced computation on backend servers.
- Consistent performance for multiple users accessing the same reports simultaneously.

---
[Backend Documentation](Backend/ReadMe.md)

