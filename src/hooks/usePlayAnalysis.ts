import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import {
  enginePlayNameAtom,
  gameAtom,
  gameDataAtom,
} from "@/sections/play/states";
import { useEngine } from "./useEngine";
import { PositionEval } from "@/types/eval";

interface UsePlayAnalysisOptions {
  depth?: number;
  multiPv?: number;
}

export const usePlayAnalysis = (
  enabled: boolean,
  { depth = 16, multiPv = 3 }: UsePlayAnalysisOptions = {}
) => {
  const engineName = useAtomValue(enginePlayNameAtom);
  const engine = useEngine(enabled ? engineName : undefined);
  const game = useAtomValue(gameAtom);
  const [gameData, setGameData] = useAtom(gameDataAtom);

  const fen = game.fen();
  const isGameOver = game.isGameOver();

  useEffect(() => {
    if (!enabled) return;
    if (!engine) return;
    if (!engine.getIsReady()) return;
    if (isGameOver) {
      setGameData((prev) => ({
        ...prev,
        isEvaluating: false,
        analysisFen: fen,
        lastAnalysisFen: prev.analysisFen ?? prev.lastAnalysisFen,
      }));
      return;
    }

    let isCancelled = false;

    const updatePositionEval = (
      positionEval: PositionEval,
      isFinal = false
    ) => {
      setGameData((prev) => {
        if (prev.analysisFen && prev.analysisFen !== fen) return prev;

        return {
          ...prev,
          eval: {
            ...positionEval,
            lines: positionEval.lines.slice(0, multiPv),
          },
          isEvaluating: !isFinal,
          analysisError: undefined,
          analysisFen: fen,
        };
      });
    };

    setGameData((prev) => ({
      ...prev,
      lastEval: prev.eval,
      lastAnalysisFen: prev.analysisFen ?? prev.lastAnalysisFen,
      eval: undefined,
      isEvaluating: true,
      analysisError: undefined,
      analysisFen: fen,
    }));

    const evaluate = async () => {
      try {
        const result = await engine.evaluatePositionWithUpdate({
          fen,
          depth,
          multiPv,
          setPartialEval: (partial) => {
            if (isCancelled) return;
            updatePositionEval(partial, false);
          },
        });

        if (!isCancelled) {
          updatePositionEval(result, true);
        }
      } catch (error) {
        if (isCancelled) return;
        console.error(error);
        setGameData((prev) => {
          if (prev.analysisFen && prev.analysisFen !== fen) return prev;

          return {
            ...prev,
            isEvaluating: false,
            analysisError:
              error instanceof Error ? error.message : "Unknown error",
          };
        });
      }
    };

    evaluate();

    return () => {
      isCancelled = true;
      engine.stopAllCurrentJobs().catch((err) => console.error(err));
    };
  }, [enabled, engine, fen, depth, multiPv, isGameOver, setGameData]);

  useEffect(() => {
    if (enabled) return;

    setGameData((prev) => ({
      ...prev,
      isEvaluating: false,
    }));
  }, [enabled, setGameData]);

  return {
    engine,
    gameData,
  };
};
