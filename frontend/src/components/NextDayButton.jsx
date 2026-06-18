import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postNextDay } from '../api/client'

export function NextDayButton() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: postNextDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign'] })
      queryClient.invalidateQueries({ queryKey: ['campaign-data'] })
      queryClient.invalidateQueries({ queryKey: ['github-issues'] })
    },
  })

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
      >
        {mutation.isPending ? 'Advancing...' : 'Next Day'}
      </button>
      {mutation.isError && (
        <p className="max-w-xs text-right text-xs text-red-600">
          {mutation.error.message}
        </p>
      )}
    </div>
  )
}
