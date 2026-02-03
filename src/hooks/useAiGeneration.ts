import { useState, useCallback } from 'react';

interface AiGenerationState {
  loading: boolean;
  error: string | null;
  result: any;
  currentProvider: string | null;
  failoverStatus: string | null;
  attempts: number;
}

interface AiGenerationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onProviderChange?: (provider: string) => void;
}

export const useAiGeneration = (options: AiGenerationOptions = {}) => {
  const [state, setState] = useState<AiGenerationState>({
    loading: false,
    error: null,
    result: null,
    currentProvider: null,
    failoverStatus: null,
    attempts: 0
  });

  const generateWithAi = useCallback(async (
    apiCall: () => Promise<any>,
    taskName: string = 'AI Generation'
  ) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      result: null,
      currentProvider: null,
      failoverStatus: 'Initializing...',
      attempts: 0
    }));

    try {
      // Simulate provider tracking (this would be enhanced with actual provider info)
      setState(prev => ({ ...prev, failoverStatus: 'Checking AI providers...' }));
      
      const result = await apiCall();
      
      setState(prev => ({
        ...prev,
        loading: false,
        result,
        failoverStatus: 'Successfully completed!',
        error: null
      }));

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;

    } catch (error: any) {
      console.error(`${taskName} failed:`, error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      let failoverMessage = 'All AI providers encountered issues.';

      // Parse enhanced error response from API
      if (error.response?.data || error.error) {
        const errorData = error.response?.data || error;
        
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        if (errorData.suggestions && Array.isArray(errorData.suggestions)) {
          failoverMessage = errorData.suggestions.join(' • ');
        }
        
        if (errorData.providersAttempted && errorData.totalAttempts) {
          failoverMessage = `Tried ${errorData.totalAttempts} attempts across ${errorData.providersAttempted.length} providers: ${errorData.providersAttempted.join(', ')}. ${failoverMessage}`;
        }
        
        if (errorData.helpText) {
          failoverMessage += ` ${errorData.helpText}`;
        }
      } else {
        // Fallback for direct error messages
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
          errorMessage = 'Too many requests. Please wait 5 minutes and try again.';
        } else if (error.message?.includes('API key') || error.message?.includes('401')) {
          errorMessage = 'API key issue. Please contact administrator.';
        } else if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
          errorMessage = 'API quota exceeded. Please contact administrator.';
        } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
          errorMessage = 'Network connection issue. Please try again.';
        } else if (error.message?.includes('All providers failed')) {
          errorMessage = 'All AI providers are currently unavailable due to quota limits.';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        failoverStatus: failoverMessage,
        attempts: error.totalAttempts || error.details?.totalAttempts || 1
      }));

      if (options.onError) {
        options.onError(errorMessage);
      }

      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      result: null,
      currentProvider: null,
      failoverStatus: null,
      attempts: 0
    });
  }, []);

  return {
    ...state,
    generateWithAi,
    reset,
    isLoading: state.loading,
    hasError: !!state.error,
    hasResult: !!state.result
  };
};

export default useAiGeneration;