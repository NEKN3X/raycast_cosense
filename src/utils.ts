export function debounce(func: (...args: unknown[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout;

  return (...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
