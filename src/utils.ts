import type { ReducedTrialRow } from "psyflow-web";

export function summarizeBlock(rows: ReducedTrialRow[], blockId: string): { accuracy: number } {
  const blockRows = rows.filter((row) => row.block_id === blockId);
  if (blockRows.length === 0) {
    return { accuracy: 0 };
  }
  const correctCount = blockRows.filter((row) => row.stimulus_hit === true).length;
  return {
    accuracy: correctCount / blockRows.length
  };
}
