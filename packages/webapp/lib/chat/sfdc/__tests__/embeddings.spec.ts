import { SalesforceEmbedder } from '../embeddings';

describe('SalesforceEmbedder adapter', () => {
  test('works with object having embed function', async () => {
    const s = new SalesforceEmbedder();
    // @ts-ignore - inject mock
    s['embeddings'] = { embed: async (t: string) => [1, 2, 3] };
    // @ts-ignore - mark initialized
    s['isInitialized'] = true;
    const v = await s.embedText('hello');
    expect(Array.isArray(v)).toBe(true);
    expect(v.length).toBe(3);
  });

  test('works with object having embedText function', async () => {
    const s = new SalesforceEmbedder();
    // @ts-ignore
    s['embeddings'] = { embedText: async (t: string) => [4, 5, 6] };
    // @ts-ignore
    s['isInitialized'] = true;
    const v = await s.embedText('hi');
    expect(v[0]).toBe(4);
  });

  test('works with function instance (constructor-like) providing embed', async () => {
    class MockCtor {
      constructor(opts: any) {}
      async embed(t: string) { return [7, 8, 9]; }
    }
    const s = new SalesforceEmbedder();
    // @ts-ignore
    s['embeddings'] = new MockCtor({});
    // @ts-ignore
    s['isInitialized'] = true;
    const v = await s.embedText('hey');
    expect(v[2]).toBe(9);
  });
});
