import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import type { QuestionPack } from '../types';
import { AI_PROMPT, SAMPLE_PACK, downloadText, packToJson } from '../lib/aiPrompt';
import { parsePackInput, type ParseResult } from '../lib/packImport';
import { CopyIcon, CrossIcon, DownloadIcon, ImportIcon, UploadIcon } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (pack: QuestionPack) => void;
}

export default function ImportPackModal({ open, onClose, onImport }: Props) {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    setText('');
    setFileName(null);
    setResult(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleValidate = () => {
    const fallback = fileName ? fileName.replace(/\.json$/i, '') : 'Imported Pack';
    setResult(parsePackInput(text, fallback));
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      setText(content);
      setResult(parsePackInput(content, file.name.replace(/\.json$/i, '')));
    };
    reader.readAsText(file);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — silently ignore */
    }
  };

  const handleDownloadSample = () => {
    downloadText('sample-pack.json', packToJson(SAMPLE_PACK));
  };

  const handleImport = () => {
    if (result?.pack) {
      onImport(result.pack);
      close();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Import question pack"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-lg rounded-t-3xl border border-white/10 p-5 shadow-card sm:rounded-3xl sm:p-6"
          >
            {/* header */}
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet text-white shadow-glow">
                  <ImportIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Import a question pack</h2>
                  <p className="text-xs text-white/50">Load a new set like inserting a game cartridge</p>
                </div>
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="flex-none rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:text-white"
              >
                <CrossIcon className="h-4 w-4" />
              </button>
            </div>

            {/* AI helper row */}
            <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row">
              <button
                onClick={handleCopyPrompt}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500/20 px-3 py-2.5 text-sm font-semibold text-brand-300 ring-1 ring-brand-400/30 transition hover:bg-brand-500/30"
              >
                <CopyIcon className="h-4 w-4" />
                {copied ? 'Prompt copied' : 'Copy AI prompt'}
              </button>
              <button
                onClick={handleDownloadSample}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
              >
                <DownloadIcon className="h-4 w-4" />
                Download sample
              </button>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-white/40">
              Paste the prompt into any AI, tell it your subject, then paste its JSON below — or upload a
              <span className="font-semibold text-white/60"> .json</span> file you saved.
            </p>

            {/* paste box */}
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setResult(null);
                setFileName(null);
              }}
              placeholder='Paste pack JSON here, e.g. { "name": "...", "questions": [ ... ] }'
              spellCheck={false}
              className="h-36 w-full resize-y rounded-2xl border border-white/10 bg-base-900/60 p-3 font-mono text-xs leading-relaxed text-white/90 outline-none transition placeholder:text-white/25 focus:border-brand-400/60"
            />

            {/* file upload */}
            <div className="mt-3 flex items-center gap-3">
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <UploadIcon className="h-4 w-4" />
                Upload .json file
              </button>
              {fileName && <span className="truncate text-xs text-white/40">{fileName}</span>}
            </div>

            {/* validation feedback */}
            {result && <Feedback result={result} />}

            {/* actions */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleValidate}
                className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10"
              >
                Validate
              </button>
              <button
                onClick={handleImport}
                disabled={!result?.pack}
                className="flex-1 rounded-2xl bg-gradient-to-r from-brand-500 to-accent-violet px-4 py-3 text-sm font-bold text-white shadow-glow transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                {result?.pack ? `Import ${result.accepted} questions` : 'Import'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Feedback({ result }: { result: ParseResult }) {
  const ok = !!result.pack;
  return (
    <div
      className={`mt-4 rounded-2xl border p-3 text-xs ${
        ok ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-rose-400/30 bg-rose-500/10'
      }`}
    >
      {ok ? (
        <p className="font-semibold text-emerald-200">
          Ready — “{result.pack!.name}” · {result.accepted} question{result.accepted === 1 ? '' : 's'}
          {result.skipped > 0 && <span className="text-amber-300"> · {result.skipped} skipped</span>}
        </p>
      ) : (
        result.errors.map((e, i) => (
          <p key={i} className="font-semibold text-rose-200">
            {e}
          </p>
        ))
      )}
      {result.warnings.length > 0 && (
        <ul className="mt-2 max-h-24 space-y-1 overflow-y-auto text-amber-300/80">
          {result.warnings.slice(0, 8).map((w, i) => (
            <li key={i}>· {w}</li>
          ))}
          {result.warnings.length > 8 && <li>· …and {result.warnings.length - 8} more</li>}
        </ul>
      )}
    </div>
  );
}
