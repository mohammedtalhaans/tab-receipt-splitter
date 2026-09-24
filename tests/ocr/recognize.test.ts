import { afterEach, expect, test, vi } from 'vitest';

const worker = vi.hoisted(() => ({
  setParameters: vi.fn(),
  recognize: vi.fn(),
  terminate: vi.fn(async () => undefined),
}));

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async () => worker),
  PSM: { SINGLE_BLOCK: '6' },
}));

import { recognize } from '../../src/features/ocr/recognize.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

test('cancelling during OCR configuration settles the scan and terminates its worker', async () => {
  vi.stubGlobal('Worker', class {});
  vi.stubGlobal('document', { baseURI: 'https://example.test/receipt-splitter/' });
  // A terminated Tesseract worker may never answer an outstanding configuration job.
  worker.setParameters.mockImplementation(() => new Promise(() => undefined));
  const controller = new AbortController();
  const scan = recognize({ blob: new Blob(['fixture']), width: 10, height: 10 }, controller.signal, () => undefined);
  const outcome = scan.catch(error => error);

  await vi.waitFor(() => expect(worker.setParameters).toHaveBeenCalledOnce());
  controller.abort();

  expect(await outcome).toMatchObject({ name: 'AbortError' });
  expect(worker.terminate).toHaveBeenCalledOnce();
  expect(worker.recognize).not.toHaveBeenCalled();
});
