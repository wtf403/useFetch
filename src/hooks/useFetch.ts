import { useEffect, useReducer, useRef } from 'react';

interface State<T> {
    data?: T;
    error?: Error;
    isLoading: boolean;
}

type Response<T> = State<T> & { refetch: () => void };

type Cache<T> = { [url: string]: T | undefined };

const ACTIONS = {
    INIT: 'INIT',
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
    REFETCH: 'REFETCH',
} as const

type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

export default function useFetch<T = unknown>({
    url,
    options,
    responseType = 'json'
}: {
    url: string,
    options?: RequestInit,
    responseType?: 'json' | 'blob'
}): Response<T> {
    const cache = useRef<Cache<T>>({});

    const refetching = useRef<boolean>(false);


    // Used to prevent state update if the component is unmounted
    const cancelRequest = useRef<boolean>(false);

    const initialState: State<T> = {
        isLoading: false,
        error: undefined,
        data: undefined,
    };

    // Keep state logic separated
    const fetchReducer = (state: State<T>, action: { type: Action, payload?: unknown }): State<T> => {
        switch (action.type) {
            case ACTIONS.INIT:
                return { ...initialState, isLoading: true, data: action.payload as T };
            case ACTIONS.SUCCESS:
                return { ...initialState, data: action.payload as T, isLoading: false };
            case ACTIONS.FAILURE:
                return { ...initialState, error: action.payload as Error, isLoading: false };
            case ACTIONS.REFETCH:
                return { ...initialState, isLoading: true, data: action.payload as T };
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(fetchReducer, initialState);


    const fetchData = async () => {
        if (!url) return;

        dispatch({ type: ACTIONS.INIT });

        if (refetching.current) {
            dispatch({ type: ACTIONS.REFETCH, payload: cache.current[url] });
            delete cache.current[url ?? ""];
        }

        // If a cache exists for this url, return it
        if (cache.current[url]) {
            dispatch({ type: ACTIONS.SUCCESS, payload: cache.current[url] });
            return;
        }

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const response = await fetch(url, options);
            let data: T | undefined;

            try {
                if (!response.ok) {
                    throw new Error(response.statusText);
                }

                if (responseType === 'json') {
                    data = (await response.json()) as T;
                    cache.current[url] = data;
                } else if (responseType === 'blob') {
                    data = (await response.blob()) as unknown as T;
                }

                if (cancelRequest.current) return;

                dispatch({ type: ACTIONS.SUCCESS, payload: data });
            } catch (error) {
                if (cancelRequest.current) return;

                dispatch({ type: ACTIONS.FAILURE, payload: error as Error });
            }
        } catch (error) {
            if (cancelRequest.current) return;

            dispatch({ type: ACTIONS.FAILURE, payload: error as Error });
        }
    }


    useEffect(() => {
        // Do nothing if the url is not given
        if (!url) return;

        cancelRequest.current = false;

        void fetchData();
        // Use the cleanup function for avoiding a possibly...
        // ...state update after the component was unmounted
        return () => {
            cancelRequest.current = true;
            refetching.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, refetching]);

    const refetch = () => {
        refetching.current = true;
        void fetchData();
    };

    return { isLoading: state.isLoading, data: state.data, error: state.error, refetch };
}
