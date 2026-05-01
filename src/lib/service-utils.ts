/**
 * Utility for wrapping service calls with logging and timing information.
 * This makes it easier to identify which logical service is being called in the console.
 */
export async function withLogging<T>(
  serviceName: string,
  actionName: string,
  promise: Promise<T>
): Promise<T> {
  const start = performance.now();
  const timestamp = new Date().toLocaleTimeString();
  
  // console.log(`%c[${timestamp}] [${serviceName}:${actionName}] Starting...`, 'color: #3b82f6; font-weight: bold;');
  
  try {
    const result = await promise;
    const end = performance.now();
    const duration = Math.round(end - start);
    
    console.log(
      `%c[${timestamp}] [${serviceName}:${actionName}] %cCompleted in ${duration}ms`, 
      'color: #10b981; font-weight: bold;', 
      'color: #6b7280; font-weight: normal;'
    );
    
    return result;
  } catch (error) {
    const end = performance.now();
    const duration = Math.round(end - start);
    
    console.error(
      `%c[${timestamp}] [${serviceName}:${actionName}] %cFailed after ${duration}ms`, 
      'color: #ef4444; font-weight: bold;', 
      'color: #6b7280; font-weight: normal;',
      error
    );
    
    throw error;
  }
}
