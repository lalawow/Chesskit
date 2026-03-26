import {
  Button,
  CircularProgress,
  FormControlLabel,
  Grid2 as Grid,
  Switch,
  Typography,
} from "@mui/material";
import { useAtom, useAtomValue } from "jotai";
import {
  gameAtom,
  isGameInProgressAtom,
  movesAnalysisEnabledAtom,
} from "./states";
import { useEffect } from "react";
import UndoMoveButton from "./undoMoveButton";
import MovesAnalysis from "./movesAnalysis";

export default function GameInProgress() {
  const game = useAtomValue(gameAtom);
  const [isGameInProgress, setIsGameInProgress] = useAtom(isGameInProgressAtom);
  const [isMovesAnalysisEnabled, setIsMovesAnalysisEnabled] = useAtom(
    movesAnalysisEnabledAtom
  );

  useEffect(() => {
    if (game.isGameOver()) setIsGameInProgress(false);
  }, [game, setIsGameInProgress]);

  const handleResign = () => {
    setIsGameInProgress(false);
  };

  if (!isGameInProgress) return null;

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      gap={2}
      size={12}
    >
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        gap={2}
        size={12}
      >
        <Typography>Game in progress</Typography>
        <CircularProgress size={20} color="info" />
      </Grid>

      <Grid container justifyContent="center" alignItems="center" size={12}>
        <UndoMoveButton />
      </Grid>

      <Grid container justifyContent="center" alignItems="center" size={12}>
        <FormControlLabel
          control={
            <Switch
              checked={isMovesAnalysisEnabled}
              onChange={(event) =>
                setIsMovesAnalysisEnabled(event.target.checked)
              }
            />
          }
          label="Moves analysis"
        />
      </Grid>

      <Grid container justifyContent="center" alignItems="center" size={12}>
        <Button variant="outlined" onClick={handleResign}>
          Resign
        </Button>
      </Grid>

      {isMovesAnalysisEnabled && (
        <Grid container justifyContent="center" size={12}>
          <MovesAnalysis />
        </Grid>
      )}
    </Grid>
  );
}
