import { useMemo } from "react";
import {
  Alert,
  CircularProgress,
  Grid2 as Grid,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { gameAtom } from "./states";
import { usePlayAnalysis } from "@/hooks/usePlayAnalysis";
import { getLineEvalLabel, moveLineUciToSan } from "@/lib/chess";

export default function MovesAnalysis() {
  const game = useAtomValue(gameAtom);
  const { gameData, engine } = usePlayAnalysis(true);
  const latestEval = gameData.eval;
  const previousEval = gameData.lastEval;
  const previousFen =
    gameData.lastAnalysisFen ?? gameData.analysisFen ?? game.fen();

  const previousUciToSan = useMemo(() => {
    if (!previousEval || !previousFen) return undefined;
    return moveLineUciToSan(previousFen);
  }, [previousEval, previousFen]);

  const lastMoveSan = gameData.lastMove?.san;
  const recommendedMoveUci =
    previousEval?.bestMove ?? previousEval?.lines?.[0]?.pv?.[0];
  const recommendedMoveSan = useMemo(() => {
    if (!recommendedMoveUci || !previousUciToSan) return undefined;
    return previousUciToSan(recommendedMoveUci);
  }, [recommendedMoveUci, previousUciToSan]);

  const evaluationBeforeLine = previousEval?.lines?.[0];
  const evaluationBeforeLabel = evaluationBeforeLine
    ? getLineEvalLabel(evaluationBeforeLine)
    : undefined;

  const evaluationAfterLine = useMemo(() => {
    const line = latestEval?.lines?.[0];
    if (!line) return undefined;
    if (!gameData.lastMove) return line;
    return {
      ...line,
      cp: line.cp !== undefined ? -line.cp : line.cp,
      mate: line.mate !== undefined ? -line.mate : line.mate,
    };
  }, [latestEval, gameData.lastMove]);

  const evaluationAfterLabel = evaluationAfterLine
    ? getLineEvalLabel(evaluationAfterLine)
    : undefined;

  const evaluationDeltaLabel = useMemo(() => {
    if (!evaluationBeforeLine || !evaluationAfterLine) return undefined;
    const beforeCp = evaluationBeforeLine.cp;
    const afterCp = evaluationAfterLine.cp;
    if (beforeCp === undefined || afterCp === undefined) return undefined;
    const deltaPawn = (afterCp - beforeCp) / 100;
    const formatted =
      Math.abs(deltaPawn) < 1 ? deltaPawn.toFixed(2) : deltaPawn.toFixed(1);
    if (deltaPawn === 0) return "0.0";
    return `${deltaPawn > 0 ? "+" : ""}${formatted}`;
  }, [evaluationBeforeLine, evaluationAfterLine]);

  const lines = previousEval?.lines ?? [];
  const isLoading = gameData.isEvaluating && !lines.length;
  const engineReady = engine?.getIsReady();
  const recommendationLabel = useMemo(() => {
    if (recommendedMoveSan) return recommendedMoveSan;
    if (gameData.isEvaluating) return "Engine is thinking…";
    return "Unavailable";
  }, [recommendedMoveSan, gameData.isEvaluating]);

  return (
    <Grid
      container
      direction="column"
      alignItems="stretch"
      rowGap={2}
      size={12}
    >
      <Typography variant="h6" textAlign="center">
        Moves Analysis
      </Typography>

      {!engineReady && (
        <Typography textAlign="center" fontSize="0.85rem">
          Engine is loading…
        </Typography>
      )}

      {gameData.analysisError && (
        <Alert severity="warning">{gameData.analysisError}</Alert>
      )}

      <Typography fontSize="0.95rem" textAlign="center">
        Last move played: {lastMoveSan ?? "—"}
      </Typography>

      <Typography fontSize="0.95rem" textAlign="center">
        Engine recommendation: {recommendationLabel}
      </Typography>

      <Typography fontSize="0.9rem" textAlign="center" color="text.secondary">
        Evaluation before move: {evaluationBeforeLabel ?? "N/A"}
      </Typography>

      <Typography fontSize="0.9rem" textAlign="center" color="text.secondary">
        Evaluation after move: {evaluationAfterLabel ?? "N/A"}
      </Typography>

      {evaluationDeltaLabel && (
        <Typography
          fontSize="0.9rem"
          textAlign="center"
          color={
            evaluationDeltaLabel.startsWith("-") ? "error.main" : "success.main"
          }
        >
          Score change (for mover): {evaluationDeltaLabel}
        </Typography>
      )}

      {isLoading ? (
        <Grid container justifyContent="center">
          <CircularProgress size={24} />
        </Grid>
      ) : (
        <List sx={{ width: "100%", paddingY: 0 }}>
          {lines.map((line) => {
            const sanMoves = previousUciToSan
              ? line.pv.map(previousUciToSan).join(", ")
              : line.pv.join(", ");
            return (
              <ListItem
                key={line.multiPv}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  paddingY: 1,
                }}
              >
                <Typography fontWeight={600}>
                  #{line.multiPv} {getLineEvalLabel(line)}
                </Typography>
                <Typography fontSize="0.85rem" color="text.secondary">
                  {sanMoves || "…"}
                </Typography>
              </ListItem>
            );
          })}
          {!lines.length && !gameData.isEvaluating && (
            <ListItem>
              <Typography fontSize="0.85rem" color="text.secondary">
                No analysis available for the previous move.
              </Typography>
            </ListItem>
          )}
        </List>
      )}
    </Grid>
  );
}
