import { useReducer, useCallback } from 'react'

interface AsyncState<T> {
  data: T
  loading: boolean
  error: string | null
}

type AsyncAction<T> = 
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; payload: string }
  | { type: 'RESET' }

function asyncReducer<T>(
  state: AsyncState<T>, 
  action: AsyncAction<T>
): AsyncState<T> {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null }
    case 'SUCCESS':
      return { data: action.payload, loading: false, error: null }
    case 'ERROR':
      return { ...state, loading: false, error: action.payload }
    case 'RESET':
      return { data: state.data, loading: false, error: null }
    default:
      return state
  }
}

export function useAsyncState<T>(initialData: T) {
  const [state, dispatch] = useReducer(
    asyncReducer<T>, 
    { data: initialData, loading: false, error: null }
  )

  const setLoading = useCallback(() => dispatch({ type: 'LOADING' }), [])
  const setSuccess = useCallback((data: T) => dispatch({ type: 'SUCCESS', payload: data }), [])
  const setError = useCallback((error: string) => dispatch({ type: 'ERROR', payload: error }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return {
    ...state,
    setLoading,
    setSuccess,
    setError,
    reset,
  }
}
