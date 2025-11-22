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
import Link from "next/link";
import { useLocalPersistence } from "@/hooks/persist";
import { PersistData } from "@/types/persist";
import { ExpConverter } from "./components/ExpConverter";

const PERSIST_KEY = 'persist-data'
const INITIAL_PERSIST_DATA: PersistData = { giftCountMap: {}, currentBondLevel: 1, goalBondLevel: 100 }

export default function Home() {
  const { data: masterData, isLoading: masterDataIsLoading } = useMasterData()
  const { data: bondExpTable } = useBondExpTable()
  const [persistData, setPersistData] = useLocalPersistence<PersistData>(PERSIST_KEY)
  const [giftCountMap, setGiftCountMap] = useState(new Map<GiftId, number>(Object.entries(persistData?.giftCountMap ?? [])))
  const [selectedStudent, setSelectedStudent] = useState(persistData?.selectedStudentId)
  /** 絆ランク入力のエラー */
  const [errorMessage, setErrorMessage] = useState("")
  /** 現在の絆ランク TODO:生徒ごとに変えられるようにする */
  const [currentBondLevel, setCurrentBondLevel] = useState(persistData?.currentBondLevel ?? 1)
  /** 目標の絆ランク TODO:生徒ごとに変えられるようにする */
  const [goalBondLevel, setGoalBondLevel] = useState(persistData?.goalBondLevel ?? 100)

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
    if (gift.id == "gift-select-box") {
      // 贈り物選択ボックスの場合、該当生徒の通常贈り物反応のうち、一番大きいものに合わせる
      if ((student.ultraFavoriteGiftIds ?? []).filter((giftId) => giftMap.get(giftId)?.type == "normal").length > 0) {
        return "ultra"
      } else if ((student.superFavoriteGiftIds ?? []).filter((giftId) => giftMap.get(giftId)?.type == "normal").length > 0) {
        return "super"
      } else if ((student.favoriteGiftIds ?? []).filter((giftId) => giftMap.get(giftId)?.type == "normal").length > 0) {
        return "favorite"
      }
      return "normal"
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
  }, [studentMap, selectedStudent, giftMap])

  /** 贈り物の数が更新された時 */
  function onGiftCountChange(id: GiftId, newValue: number) {
    giftCountMap.set(id, isNaN(newValue) ? 0 : newValue)
    const newMap = new Map(giftCountMap)
    setGiftCountMap(newMap) // hookのdeps更新検知のためMapを再作成
    console.log(id, newMap)
    setPersistData({ giftCountMap: Object.fromEntries(newMap), currentBondLevel: currentBondLevel, selectedStudentId: selectedStudent })
  }

  function onSelectedStudentChange(id?: StudentVariantId) {
    // console.log("selected student:", id, studentMap.get(id ?? "")?.name)
    setSelectedStudent(id)
    setPersistData({ giftCountMap: Object.fromEntries(giftCountMap), currentBondLevel: currentBondLevel, selectedStudentId: id })
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

  /** 現在の絆ランクが変更された時のイベントハンドラ */
  const onChangeCurrentBondLevel = (currentLevelStr: string) => {
    const currentLevel = parseInt(currentLevelStr)
    if (isNaN(currentLevel) || currentLevel < 1 || currentLevel > 100) {
      setErrorMessage("絆ランクは1以上100以下の整数を入力してください")
    } else {
      setErrorMessage("")
      setCurrentBondLevel(currentLevel)
      setPersistData({ giftCountMap: Object.fromEntries(giftCountMap), currentBondLevel: currentLevel, selectedStudentId: selectedStudent })
    }
  }

  /** 目標の絆ランクが変更された時のイベントハンドラ */
  const onChangeGoalBondLevel = (goalLevelStr: string) => {
    const goalLevel = parseInt(goalLevelStr)
    if (isNaN(goalLevel) || goalLevel < 1 || goalLevel > 100) {
      setErrorMessage("絆ランクは1以上100以下の整数を入力してください")
    } else {
      setErrorMessage("")
      setGoalBondLevel(goalLevel)
      setPersistData({ ...persistData ?? INITIAL_PERSIST_DATA, goalBondLevel: goalLevel })
    }
  }

  /** 現在の絆ランクから贈り物経験値を合計した絆経験値 */
  const expectedExp = useMemo(() => {
    if (isNaN(currentBondLevel)) return undefined
    const currentExp = bondExpMap.get(currentBondLevel)
    if (currentExp == undefined) return undefined
    return currentExp + totalExp
  }, [bondExpMap, currentBondLevel, totalExp])

  /** 絆ランクの期待値 */
  const calcExpectedBondLevel = useMemo(() => {
    if (expectedExp == undefined || bondExpTable?.bondExpTable == undefined) return undefined

    return bondExpTable?.bondExpTable.findLastIndex((v) => v <= expectedExp) + 1
  }, [bondExpTable?.bondExpTable, expectedExp])

  /** 次のランクまで必要な経験値 */
  const requiredExpToNextLevel = useMemo<[number, number] | undefined>(() => {
    if (calcExpectedBondLevel == undefined
      || expectedExp == undefined
      || calcExpectedBondLevel < 1
      || calcExpectedBondLevel >= 100
      || calcExpectedBondLevel >= goalBondLevel) return undefined
    const nextLevelExp = bondExpTable?.bondExpTable[calcExpectedBondLevel]
    if (nextLevelExp == undefined) return undefined
    return [calcExpectedBondLevel + 1, nextLevelExp - expectedExp]
  }, [calcExpectedBondLevel, expectedExp, goalBondLevel, bondExpTable?.bondExpTable])

  /** 目標のランクまで必要な経験値 */
  const requiredExpToGoalLevel = useMemo(() => {
    if (expectedExp == undefined) return undefined
    const goalLevelExp = bondExpTable?.bondExpTable[goalBondLevel - 1]
    if (goalLevelExp == undefined) return undefined
    const requiredExp = goalLevelExp - expectedExp
    return requiredExp <= 0 ? undefined : requiredExp
  }, [expectedExp, goalBondLevel, bondExpTable?.bondExpTable])

  return (
    <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-6xl flex-col items-center justify-between py-8 px-4 sm:px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-xl mb-4 pb-1 border-b-2 border-red-200 w-full">ブルアカ 絆ランクシミュレータ</h1>
        <p>
          所有している贈り物・製造用アイテムの数から到達できる絆ランクを計算します。
        </p>
        {/* 生徒の選択 */}
        <div id="student-selector" className="my-2">
          生徒を選択: <StudentSelector students={masterData?.students ?? []} onChange={onSelectedStudentChange} initialValue={persistData?.selectedStudentId} />
        </div>
        <p className="text-xs">
          ゲーム内のメニュー「アイテム」→フィルター「贈り物」→ソート「デフォルト」で所持している贈り物数を調べられます。PCではTabキーで入力欄を移動できます。
        </p>
        {/* 贈り物の数を入力するフォーム */}
        {/* grid-cols-5 gap-2 */}
        <div id="gift-count-form" className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-2">
          {masterData?.gifts.map((gift) =>
            <GiftCountForm key={`gift-form-${gift.id}`} gift={gift} effectivity={getStudentEffectivity(gift)} onChange={onGiftCountChange} initialValue={giftCountMap.get(gift.id)} />
          )}
        </div>
        <div id="gift-total-score" className="my-4 text-sm">
          現在の絆ランクの経験値 {bondExpMap.get(currentBondLevel) ?? "-"}
          &nbsp;&nbsp;+&nbsp;&nbsp;
          贈り物で得られる絆経験値 {totalExp}
          &nbsp;&nbsp;=&nbsp;&nbsp;
          総絆経験値 {bondExpMap.get(currentBondLevel) != undefined ? ((bondExpMap.get(currentBondLevel) ?? 0) + totalExp) : "-"}
        </div>
        {/* 現在の絆ランクと、アイテムで到達できる絆ランクを表示 */}
        <div id="bond-level-indicator" className="flex items-baseline gap-2 w-full justify-center">
          <TextField variant="standard" label="現在の絆ランク" className="w-30" type="number"
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
          <TextField variant="standard" label="到達できる絆ランク" disabled className="w-30"
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
          <KeyboardDoubleArrowRightIcon className="block" />
          <TextField variant="standard" label="目標の絆ランク" className="w-30" type="number"
            defaultValue={goalBondLevel}
            onChange={(e) => onChangeGoalBondLevel(e.target.value)}
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
        {requiredExpToNextLevel &&
          <div className="mt-4 text-sm">
            次のランク<FavoriteIcon className="text-red-300" fontSize="inherit" />{requiredExpToNextLevel[0]} までに必要な経験値(=絆ポイント): <ExpConverter exp={requiredExpToNextLevel[1]} />
          </div>
        }
        {requiredExpToGoalLevel &&
          <div className="mt-2 text-sm">
            目標のランク<FavoriteIcon className="text-red-300" fontSize="inherit" />{goalBondLevel} までに必要な経験値(=絆ポイント): <ExpConverter exp={requiredExpToGoalLevel} />
          </div>
        }        <div className="mt-8 pt-4 border-t-2 border-red-200 w-full">
          ※ブラウザにのみデータを保存しています。ブラウザのキャッシュ等をクリアすると値は初期化されます。<br />
          Contact: @zeroichi
          &nbsp;
          <Link className="text-blue-600" href="https://x.com/zeroichi" target="_blank" rel="noopener">X (Twitter)</Link>
          &nbsp;/&nbsp;
          <Link className="text-blue-600" href="https://github.com/zeroichi/ba-kizuna-calc" target="_blank" rel="noopener">GitHub</Link>
        </div>
        <div className="mt-8 pt-4 border-t-4 border-gray-200 w-full">
          <h2>更新履歴</h2>
          <ul className="list-disc ml-6">
            <li>2025/11/22
              <ul>
                <li>次の絆ランク経験値の表示機能を追加</li>
                <li>目標の絆ランク入力と、目標ランクまでの経験値の表示機能を追加</li>
                <li>経験値のカフェタッチ回数などへの換算表示機能を追加</li>
              </ul>
            </li>
            <li>2025/11/20
              <ul>
                <li>新規実装生徒「タカネ」「ヤクモ」追加</li>
                <li>&quot;絆ランク&quot;に用語を統一</li>
                <li>高級贈り物と通常贈り物の違いが分かるように背景色を変更</li>
                <li>スマホ向けにレイアウト微調整(レスポンシブ対応)</li>
              </ul>
            </li>
            <li>2025/11/16
              <ul>
                <li>初版公開</li>
              </ul>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
