export function convertTimestampsToDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // If it's a Firebase Timestamp
  if (typeof obj.toDate === 'function') {
    return obj.toDate();
  }
  
  if (obj instanceof Date) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(convertTimestampsToDates);
  }
  
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = convertTimestampsToDates(obj[key]);
    }
    return newObj;
  }
  
  return obj;
}
