import { vi } from "vitest";

export function buildSelectChain<T = unknown>(resolved: T[] = []) {
  const chain = {
    from: vi.fn(),
    where: vi.fn().mockResolvedValue(resolved),
    innerJoin: vi.fn(),
    leftJoin: vi.fn(),
    groupBy: vi.fn(),
    orderBy: vi.fn(),
  };
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.leftJoin.mockReturnValue(chain);
  chain.groupBy.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  return chain;
}

export function buildUpdateChain<T = unknown>(resolved: T[] = []) {
  const chain = {
    set: vi.fn(),
    where: vi.fn().mockResolvedValue(resolved),
    returning: vi.fn().mockResolvedValue(resolved),
  };
  chain.set.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  return chain;
}

export function buildInsertChain<T = unknown>(resolved: T[] = []) {
  const upsertChain = {
    returning: vi.fn().mockResolvedValue(resolved),
    then(
      onFulfilled?: ((v: T[]) => unknown) | null,
      onRejected?: ((r: unknown) => unknown) | null
    ) {
      return Promise.resolve(resolved).then(onFulfilled as never, onRejected);
    },
  };
  const chain = {
    values: vi.fn(),
    returning: vi.fn().mockResolvedValue(resolved),
    onConflictDoNothing: vi.fn().mockResolvedValue(resolved),
    onConflictDoUpdate: vi.fn().mockReturnValue(upsertChain),
  };
  chain.values.mockReturnValue(chain);
  return chain;
}

export function buildDeleteChain() {
  return { where: vi.fn().mockResolvedValue(undefined) };
}
