import { SimpleVectorStore } from '../dist/vector-store.js';

function randomVec(dim) {
  const v = new Array(dim);
  for (let i = 0; i < dim; i++) v[i] = Math.random() * 2 - 1;
  return v;
}

(async () => {
  const dim = 128; // smaller for quick smoke
  const store = new SimpleVectorStore({ dim, expectedCapacity: 2048, tables: 8, bits: 10 });
  const n = 2000;
  const vecs = [];
  for (let i = 0; i < n; i++) vecs.push(randomVec(dim));
  const ids = store.addVectors(vecs);
  console.log('added', ids.length, 'vectors');
  const q = randomVec(dim);
  const res = store.similaritySearchVectorWithScore(q, 10);
  console.log('query results', res.length);
  console.log(res.slice(0,3));
})();
