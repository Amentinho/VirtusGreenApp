import i18n from '@/i18n';

interface ApiErrorResponse {
  message?: string;
  errors?: Array<{
    code?: string;
    path?: string[];
    message?: string;
  }>;
  details?: string;
}

export function parseApiError(error: unknown): string {
  if (!error) {
    return i18n.t('common.errors.generic', { defaultValue: 'Something went wrong. Please try again.' });
  }

  if (error instanceof Error) {
    const errorMessage = error.message;

    // Try to extract JSON from error message (e.g., "400: {...}")
    const jsonMatch = errorMessage.match(/^\d+:\s*({.+})$/);
    
    if (jsonMatch) {
      try {
        const errorData: ApiErrorResponse = JSON.parse(jsonMatch[1]);
        
        // Handle validation errors
        if (errorData.errors && errorData.errors.length > 0) {
          const firstError = errorData.errors[0];
          
          // Map common validation error codes to user-friendly messages
          if (firstError.code === 'invalid_type') {
            const fieldName = firstError.path?.[0] || 'field';
            return i18n.t('common.errors.invalid_field', { 
              field: fieldName, 
              defaultValue: `Please check the ${fieldName} field` 
            });
          }
          
          if (firstError.code === 'too_small' || firstError.code === 'too_big') {
            return i18n.t('common.errors.invalid_value', { 
              defaultValue: 'Please check your input values' 
            });
          }
          
          // Return the first error message if it's user-friendly
          if (firstError.message && firstError.message.length < 100) {
            return firstError.message;
          }
        }
        
        // Use the main message if available and user-friendly
        if (errorData.message && errorData.message.length < 100) {
          return errorData.message;
        }
        
      } catch (e) {
        console.error('Failed to parse error JSON:', e);
      }
    }
    
    // Handle specific HTTP status codes
    if (errorMessage.includes('401')) {
      return i18n.t('common.errors.unauthorized', { 
        defaultValue: 'Please log in to continue' 
      });
    }
    
    if (errorMessage.includes('403')) {
      return i18n.t('common.errors.forbidden', { 
        defaultValue: 'You do not have permission to do this' 
      });
    }
    
    if (errorMessage.includes('404')) {
      return i18n.t('common.errors.not_found', { 
        defaultValue: 'The requested item was not found' 
      });
    }
    
    if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
      return i18n.t('common.errors.server', { 
        defaultValue: 'Server error. Please try again later' 
      });
    }
    
    // If error message is short and doesn't contain technical details, use it
    if (errorMessage.length < 100 && !errorMessage.includes('{') && !errorMessage.includes('Error:')) {
      return errorMessage;
    }
  }

  // Fallback to generic error message
  return i18n.t('common.errors.generic', { 
    defaultValue: 'Something went wrong. Please try again.' 
  });
}
