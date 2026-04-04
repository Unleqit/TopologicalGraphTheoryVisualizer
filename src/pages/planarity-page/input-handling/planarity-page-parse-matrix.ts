export function parseMatrix(text: string): number[][] {
  text = text.trim();
  if (!text) {
    throw new Error('Please enter a matrix.');
  }
  const matrix = text.split('\n').map((line) =>
    line
      .trim()
      .split(/\s+/)
      .map((v) => {
        const num = Number(v);
        if (Number.isNaN(num)) {
          throw new Error('Invalid number in matrix.');
        }
        return num;
      })
  );
  return matrix;
}
