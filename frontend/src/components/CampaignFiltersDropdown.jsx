import {
  NUMERIC_FIELDS,
  createEmptyNumericFilters,
} from '../utils/campaignFilters'

const STATUS_OPTIONS = ['active', 'paused', 'completed']

export function CampaignFiltersDropdown({
  statusFilters,
  overBudgetOnly,
  numericFilters,
  onToggleStatus,
  onToggleOverBudget,
  onNumericFilterChange,
  onClearFilters,
  onClose,
}) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-10 cursor-default"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div className="absolute right-0 z-20 mt-1 max-h-[min(70vh,32rem)] w-80 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
        </p>
        {STATUS_OPTIONS.map((status) => (
          <label
            key={status}
            className="flex cursor-pointer items-center gap-2 py-1 text-sm capitalize text-slate-700"
          >
            <input
              type="checkbox"
              checked={statusFilters.has(status)}
              onChange={() => onToggleStatus(status)}
            />
            {status}
          </label>
        ))}

        <hr className="my-3 border-slate-200" />

        <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={overBudgetOnly}
            onChange={onToggleOverBudget}
          />
          Over 90% budget
        </label>

        <hr className="my-3 border-slate-200" />

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Metrics
        </p>
        <div className="space-y-3">
          {NUMERIC_FIELDS.map(({ key, label }) => {
            const filter = numericFilters[key]
            const isBetween = filter.mode === 'between'

            return (
              <div key={key}>
                <p className="mb-1 text-xs font-medium text-slate-600">{label}</p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={filter.value}
                    onChange={(e) =>
                      onNumericFilterChange(key, { value: e.target.value })
                    }
                    placeholder={isBetween ? 'Min' : 'Value'}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={filter.mode}
                    onChange={(e) =>
                      onNumericFilterChange(key, {
                        mode: e.target.value,
                        valueMax: e.target.value === 'equals' ? '' : filter.valueMax,
                      })
                    }
                    className="rounded border border-slate-300 px-1 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="equals">Equals</option>
                    <option value="between">Between</option>
                  </select>
                  {isBetween && (
                    <input
                      type="number"
                      value={filter.valueMax}
                      onChange={(e) =>
                        onNumericFilterChange(key, { valueMax: e.target.value })
                      }
                      placeholder="Max"
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <hr className="my-3 border-slate-200" />

        <button
          type="button"
          onClick={onClearFilters}
          className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Clear filters
        </button>
      </div>
    </>
  )
}

export { createEmptyNumericFilters }
