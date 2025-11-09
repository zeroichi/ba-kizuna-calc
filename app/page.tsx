'use client'

import { useBondExpTable, useMasterData } from "@/hooks/useMasterData";
import { GiftCountForm } from "./components/GiftCountForm";
import { StudentSelector } from "./components/StudentSelector";
import FavoriteIcon from '@mui/icons-material/Favorite';
import TextField from '@mui/material/TextField';
import { InputAdornment } from "@mui/material";
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { Gift, GiftId, StudentVariant, StudentVariantId } from "@/types/master";
import { useCallback, useMemo, useState } from "react";
import { getEffectivity } from "@/utils/utils";

export default function Home() {
  const { data: masterData, isLoading: masterDataIsLoading } = useMasterData()
  const { data: bondExpTable } = useBondExpTable()
  const [giftCountMap, setGiftCountMap] = useState(new Map<GiftId, number>())
  const [selectedStudent, setSelectedStudent] = useState(undefined as StudentVariantId | undefined)
  /** 絆レベル入力のエラー */
  const [errorMessage, setErrorMessage] = useState("")
  const [currentBondLevel, setCurrentBondLevel] = useState(1)

  /** 経験値テーブルマップ (Level => Exp) */
  const bondExpMap = useMemo(() => {
    return new Map<number, number>(bondExpTable?.bondExpTable.map((v, i) => [i + 1, v]))
  }, [bondExpTable?.bondExpTable])

  /** GiftId => Gift のマップ */
  const giftMap = useMemo(() => {
    return new Map<GiftId, Gift>(masterData?.gifts.map(g => [g.id, g]))
  }, [masterData?.gifts])

  /** StudentVariantId => StudentVariant のマップ */
  const studentMap = useMemo(() => {
    return new Map<StudentVariantId, StudentVariant>(
      masterData?.students.flatMap(student => student.variants.map(variant => [variant.id, variant]))
    )
  }, [masterData?.students])

  /** 贈り物に対する生徒の効果(反応)を得る */
  const getStudentEffectivity = useCallback((gift: Gift) => {
    const student = studentMap.get(selectedStudent ?? "")
    if (student == undefined) {
      return undefined
    }
    if ((student.ultraFavoriteGiftIds ?? []).includes(gift.id)) {
      // console.log(`${gift.id} => ultra`)
      return "ultra"
    } else if ((student.superFavoriteGiftIds ?? []).includes(gift.id)) {
      // console.log(`${gift.id} => super`)
      return "super"
    } else if ((student.favoriteGiftIds ?? []).includes(gift.id)) {
      // console.log(`${gift.id} => favorite`)
      return "favorite"
    }
    return "normal"
  }, [studentMap, selectedStudent])

  function onGiftCountChange(id: GiftId, newValue: number) {
    giftCountMap.set(id, isNaN(newValue) ? 0 : newValue)
    setGiftCountMap(new Map(giftCountMap)) // hookのdeps更新検知のためMapを再作成
    // console.log(id, newValue)
  }

  function onSelectedStudentChange(id?: StudentVariantId) {
    // console.log("selected student:", id, studentMap.get(id ?? "")?.name)
    setSelectedStudent(id)
  }

  const totalExp = useMemo(() =>
    giftCountMap.keys().map((giftId) => {
      const gift = giftMap.get(giftId)
      if (gift == undefined) {
        console.warn("Unknown gift id:", giftId)
        return 0;
      }
      const effectivity = getStudentEffectivity(gift)
      const [reaction, exp] = getEffectivity(gift, effectivity)
      // console.log(`${gift.name} 効果${reaction} exp:${exp}`)
      return exp * (giftCountMap.get(giftId) ?? 0)
    }).reduce((sum, each) => sum + each, 0)
    , [getStudentEffectivity, giftCountMap, giftMap])

  /** 現在の絆レベルが変更された時のイベントハンドラ */
  const onChangeCurrentBondLevel = (currentLevelStr: string) => {
    // console.log("onChangeCurrentBondLevel", currentLevelStr)
    const currentLevel = parseInt(currentLevelStr)
    if (isNaN(currentLevel) || currentLevel < 1 || currentLevel > 100) {
      setErrorMessage("絆レベルは1以上100以下の整数を入力してください")
    } else {
      setErrorMessage("")
      setCurrentBondLevel(currentLevel)
    }
  }

  /** 絆レベルの期待値を再計算する */
  const calcExpectedBondLevel = useMemo(() => {
    // console.log("現在の絆レベル:", currentBondLevel)
    if (isNaN(currentBondLevel)) return undefined

    const currentExp = bondExpMap.get(currentBondLevel)
    // console.log("現在の絆経験値:", currentExp)
    if (currentExp == undefined) return undefined

    const expectedExp = currentExp + totalExp
    // console.log("期待の絆経験値:", expectedExp)
    if(bondExpTable?.bondExpTable == undefined) return undefined

    return bondExpTable.bondExpTable.findLastIndex((v) => v <= expectedExp) + 1
  }, [bondExpMap, bondExpTable, currentBondLevel, totalExp])

  return (
    <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-6xl flex-col items-center justify-between py-8 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-xl mb-4 pb-1 border-b-2 border-red-200 w-full">ブルアカ 絆レベル計算機</h1>
        <p>
          所有している贈り物・製造用アイテムの数から到達できる絆レベルを計算します。
        </p>
        {/* 生徒の選択 */}
        <div id="student-selector" className="my-2">
          生徒を選択: <StudentSelector students={masterData?.students ?? []} onChange={onSelectedStudentChange} />
        </div>
        {/* 贈り物の数を入力するフォーム */}
        {/* grid-cols-5 gap-2 */}
        <div id="gift-count-form" className="grid grid-cols-10 gap-2">
          {masterData?.gifts.map((gift) =>
            <GiftCountForm key={`gift-form-${gift.id}`} gift={gift} effectivity={getStudentEffectivity(gift)} onChange={onGiftCountChange} />
          )}
        </div>
        <div id="gift-total-score" className="my-4 text-sm">
          贈り物で得られる絆経験値: {totalExp}
        </div>
        {/* 現在の絆レベルと、アイテムで到達できる絆レベルを表示 */}
        <div id="bond-level-indicator" className="flex items-baseline gap-8 w-full justify-center">
          <TextField variant="standard" label="現在の絆レベル" className="w-32" type="number"
            defaultValue={currentBondLevel}
            onChange={(e) => onChangeCurrentBondLevel(e.target.value)}
            slotProps={{
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
          <TextField variant="standard" label="到達できる絆レベル" disabled className="w-32"
            value={(errorMessage || !calcExpectedBondLevel) && "-" || calcExpectedBondLevel}
            slotProps={{
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
        {errorMessage && <div className="my-4 p-4 border-2 border-red-200 rounded-lg bg-red-50 text-red-600">
          {errorMessage}
        </div>}
      </main>
    </div>
  );
}
