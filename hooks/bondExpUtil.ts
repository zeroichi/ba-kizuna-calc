import { useBondExpTable } from "./useMasterData";
import { useCallback, useMemo } from "react";

/** 絆ポイントテーブルを保持し、ユーティリティメソッドを提供するフック */
export const useBondExpUtil = () => {
  const expTable = useBondExpTable()

  /** 経験値テーブルマップ (Rank => Exp) */
  const bondExpMap = useMemo(() => {
    return new Map<number, number>(expTable.data?.bondExpTable?.map((v, i) => [i + 1, v]))
  }, [expTable.data?.bondExpTable])

  /** 絆ランク(1-100)から対応する絆ポイントを得る */
  const getExpFromRank = useCallback((bondRank: number) => {
    return bondExpMap.get(bondRank)
  }, [bondExpMap])

  /** 絆ポイントから達成している絆ランク(1-100)を得る */
  const getRankFromExp = useCallback((bondExp: number) => {
    if (!expTable.data?.bondExpTable) return undefined
    return expTable.data.bondExpTable.findLastIndex((v) => v <= bondExp) + 1
  }, [expTable.data])

  return {
    ...expTable,
    getExpFromRank,
    getRankFromExp,
  }
}

export default useBondExpUtil
