# Stage 1

## Notification_System_Design.md
### Campus Notifications Priority Inbox — Technical Design

---

## Approach

The goal of Stage 1 is to identify the **top-N (default: 10) highest-priority unread notifications** from the evaluation API and present them in ranked order. Rather than simply sorting all notifications (which is expensive as data grows), we use an **efficient min-heap strategy** that processes notifications in a single pass.

---

## Priority Logic

Priority is determined by a **composite numeric score**:

```
score = (typeWeight × 10¹³) + unixTimestampMs
```

### Type Weights

| Type      | Weight | Rationale                         |
|-----------|--------|-----------------------------------|
| Placement | 3      | Most critical — career impact     |
| Result    | 2      | High importance — academic impact |
| Event     | 1      | Informational                     |

### Why multiply by 10¹³?

The current Unix timestamp in milliseconds is approximately `1.7 × 10¹²`. By multiplying the weight by `10¹³`, the type weight always numerically dominates the timestamp, ensuring:

- A Placement notification is **always** ranked above a Result, regardless of time.
- Within the same type, **newer notifications rank higher** (larger timestamp → larger score).

This gives us a clean, single-number sort key combining both dimensions.

---

## Data Structures Used

### Min-Heap (`MinHeap<T>`)

A generic min-heap backed by an array, with a custom comparator.

| Operation | Time Complexity |
|-----------|-----------------|
| `push`    | O(log n)        |
| `pop`     | O(log n)        |
| `peek`    | O(1)            |
| `size`    | O(1)            |

The heap is maintained at max size **N** (the top-N threshold). The root always holds the **lowest-scoring item** among the current top-N candidates — making it easy to decide whether a new notification deserves a spot.

---

## Algorithm: `getTopN(notifications[], N)`

```
Initialize MinHeap H (min-heap on score), size ≤ N

For each notification x in all M notifications:
  score = computeScore(x)
  If H.size < N:
    H.push(x, score)
  Else If score > H.peek().score:
    H.pop()              // evict the lowest of the current top-N
    H.push(x, score)    // replace with the new higher-priority item
  Else:
    discard x           // not in top-N

Return H.toArray().sort(descending)
```

---

## Complexity Analysis

| Scenario                          | Complexity    |
|-----------------------------------|---------------|
| Process M notifications, keep N   | **O(M log N)**|
| Naïve full sort approach          | O(M log M)    |
| New notification arrives (stream) | **O(log N)**  |
| Retrieve top-N results            | O(N log N)    |

Since N is fixed (10, 15, or 20), `log N` is effectively a **constant** (≈ 4). This means even as M grows to millions of notifications, each new notification costs only ~4 operations to process.

---

## Scaling with Continuous Data

The system is designed to handle **streaming notifications** efficiently:

1. **Fixed memory**: The heap never grows beyond N elements, regardless of total notifications received.
2. **O(log N) per insertion**: Processing each new notification is O(log N), not O(M). As M → ∞, cost per item stays constant.
3. **No full re-sort**: When a new notification arrives, we compare it against the heap root (O(1)) and potentially do one heap operation (O(log N)). We never re-sort the entire dataset.
4. **Stateless per request**: The engine is designed as a pure function — it can be called repeatedly as the API returns new data without any shared mutable state.

### Comparison Table

| Approach              | Per-item cost | Memory   | Supports streaming |
|-----------------------|--------------|----------|--------------------|
| Full sort every time  | O(M log M)   | O(M)     | ✗ (rescans all)    |
| **Min-Heap (ours)**   | **O(log N)** | **O(N)** | ✓                  |
| Priority Queue lib    | O(log N)     | O(N)     | ✓                  |

---

## Stage 2 Notes

The same priority engine is mirrored client-side in the Next.js frontend (`src/lib/priorityEngine.ts`), enabling the Priority Inbox page to rank notifications locally without an additional backend service. The frontend heap implementation is identical in logic to the Stage 1 backend code.

---

## API

- **Endpoint**: `GET http://20.207.122.201/evaluation-service/notifications`
- **Query Params**: `page`, `limit`, `notification_type`
- **Auth**: Pre-authorised per evaluation spec (no login required)
- **Response**: `{ notifications: [{ ID, Type, Message, Timestamp }] }`

---

## Logging Middleware

Every module uses `createLogger(moduleName)` from the custom logging middleware. Log levels used:
- `INFO` — API calls, state transitions, computation milestones
- `DEBUG` — per-notification score calculations, heap operations
- `WARN` — unexpected data (invalid timestamp, malformed response)
- `ERROR` — fetch failures, fatal errors

**No `console.log` is used anywhere in the codebase.**
