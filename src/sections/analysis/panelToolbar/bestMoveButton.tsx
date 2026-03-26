import { Icon } from "@iconify/react";
import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { useChessActions } from "@/hooks/useChessActions";
import { boardAtom, currentPositionAtom } from "../states";

export default function BestMoveButton() {
  const position = useAtomValue(currentPositionAtom);
  const { addMoves } = useChessActions(boardAtom);

  const bestMove = useMemo(() => {
    if (position?.eval?.bestMove) {
      return position.eval.bestMove;
    }

    const firstLineMove = position?.eval?.lines?.[0]?.pv?.[0];
    return firstLineMove;
  }, [position]);

  return (
    <Tooltip title="Play best move">
      <Grid>
        <IconButton
          onClick={() => bestMove && addMoves([bestMove])}
          disabled={!bestMove}
          sx={{ paddingX: 1.2, paddingY: 0.5 }}
        >
          <Icon icon="ri:search-ai-3-line" height={28} />
        </IconButton>
      </Grid>
    </Tooltip>
  );
}
