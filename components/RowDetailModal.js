"use client";

export default function RowDetailModal({ row, onClose }) {
  const entries = Object.entries(row || {});

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Row details</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Close
          </button>
        </div>
        <dl className="space-y-2 text-xs">
          {entries.map(([key, value]) => {
            if (
              key === "id" ||
              key === "clientId" ||
              key === "uploadId"
            ) {
              return null;
            }
            return (
              <div
                key={key}
                className="grid grid-cols-3 gap-2 border-b border-slate-800/60 pb-1"
              >
                <dt className="font-medium text-slate-300 break-all">
                  {key}
                </dt>
                <dd className="col-span-2 text-slate-200 break-all">
                  {value == null || value === "" ? "—" : String(value)}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}

