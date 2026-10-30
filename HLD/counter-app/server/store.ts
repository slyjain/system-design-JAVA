import type { Collection, Db } from 'mongodb';

type Counter = { _id: string; value: number };
export class CounterLimitError extends Error {}

export interface CounterStore {
  read(): Promise<number>;
  increment(): Promise<number>;
  ping(): Promise<void>;
}

export class MongoCounterStore implements CounterStore {
  private readonly counters: Collection<Counter>;

  constructor(private readonly db: Db) {
    this.counters = db.collection<Counter>('counters');
  }

  async initialize(): Promise<void> {
    // Only initialize a missing document; never reset an existing counter.
    // The fixed _id's unique index also prevents duplicate counters on startup.
    try {
      await this.counters.updateOne({ _id: 'global' }, { $setOnInsert: { value: 0 } }, {
        upsert: true, maxTimeMS: 5000,
      });
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 11000)) throw error;
      // Another instance may have initialized the same document concurrently.
    }
    await this.read();
  }

  private value(document: Counter | null): number {
    if (!document || !Number.isSafeInteger(document.value) || document.value < 0) {
      throw new Error('Counter is missing or invalid');
    }
    return document.value;
  }

  async read(): Promise<number> {
    return this.value(await this.counters.findOne({ _id: 'global' }, { maxTimeMS: 5000 }));
  }

  async increment(): Promise<number> {
    const updated = await this.counters.findOneAndUpdate(
      { _id: 'global', value: { $gte: 0, $lt: Number.MAX_SAFE_INTEGER } },
      { $inc: { value: 1 } },
      { returnDocument: 'after', includeResultMetadata: false, maxTimeMS: 5000 },
    );
    if (!updated) {
      const current = await this.read();
      if (current === Number.MAX_SAFE_INTEGER) throw new CounterLimitError('Counter limit reached');
      throw new Error('Counter could not be updated');
    }
    return this.value(updated);
  }

  async ping(): Promise<void> {
    await this.db.command({ ping: 1 }, { timeoutMS: 5000 });
  }
}
