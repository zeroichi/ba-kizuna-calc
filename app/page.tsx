'use client'

import { useBondExpTable, useMasterData } from "@/hooks/useMasterData";
import { GiftCountForm } from "./components/GiftCountForm";
import { StudentSelector } from "./components/StudentSelector";
import FavoriteIcon from '@mui/icons-material/Favorite';
import TextField from '@mui/material/TextField';
import { InputAdornment } from "@mui/material";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { Gift, GiftId } from "@/types/master";
import { useMemo, useState } from "react";

export default function Home() {
  const { data: masterData, isLoading: masterDataIsLoading } = useMasterData()
  const { data: bondExpTable } = useBondExpTable()
  const [giftCountMap, setGiftCountMap] = useState(new Map<GiftId, number>())
  const [totalScore, setTotalScore] = useState(0)

  console.log(masterData)

  /** GiftId => Gift のマップ */
  const giftMap = useMemo(() => {
    return new Map<GiftId, Gift>(masterData?.gifts.map(g => [g.id, g]))
  }, [masterData?.gifts])

  const calcTotalScore = () => giftCountMap.keys().map((giftId) => {
    const gift = giftMap.get(giftId)
    switch (gift?.type) {
      case undefined:
        console.warn("Unknown gift id:", giftId)
        return 0;
      case "normal":
        return (giftCountMap.get(giftId) ?? 0) * 20
      case "normal-all":
        return (giftCountMap.get(giftId) ?? 0) * 60
      case "high":
        return (giftCountMap.get(giftId) ?? 0) * 120
      case "high-all":
        return (giftCountMap.get(giftId) ?? 0) * 240
    }
  }).reduce((sum, each) => sum + each, 0)

  function onGiftCountChange(id: GiftId, newValue: number) {
    giftCountMap.set(id, isNaN(newValue) ? 0 : newValue)
    setGiftCountMap(giftCountMap)
    setTotalScore(calcTotalScore())
    console.log(id, newValue)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-8 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-xl mb-4">ブルアカ 絆レベル計算機</h1>
        <p>
          所有している贈り物・製造用アイテムの数から到達できる絆レベルを計算します。
        </p>
        {/* 生徒の選択 */}
        <div id="student-selector" className="my-2">
          生徒を選択: <StudentSelector students={masterData?.students ?? []} />
        </div>
        {/* 贈り物の数を入力するフォーム */}
        <div id="gift-count-form" className="grid grid-cols-4 gap-2">
          {masterData?.gifts.map((gift) => <GiftCountForm key={`gift-form-${gift.id}`} gift={gift} onChange={onGiftCountChange} />)}
        </div>
        <div id="gift-total-score" className="my-4">
          贈り物で得られる絆経験値: {totalScore}
        </div>
        {/* 現在の絆レベルと、アイテムで到達できる絆レベルを表示 */}
        <div id="bond-level-indicator" className="flex items-baseline gap-8">
          <TextField variant="standard" label="現在の絆レベル" className="w-32" slotProps={{
            /* テキストボックスの頭にハートマーク */
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FavoriteIcon className="text-red-300" />
                </InputAdornment>
              )
            }
          }} />
          <KeyboardDoubleArrowRightIcon className="block" />
          <TextField variant="standard" label="到達できる絆レベル" disabled className="w-32" slotProps={{
            /* テキストボックスの頭にハートマーク */
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FavoriteIcon className="text-red-300" />
                </InputAdornment>
              )
            }
          }} />
        </div>
      </main>
    </div>
  );
}
