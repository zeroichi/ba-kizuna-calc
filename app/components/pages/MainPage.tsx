'use client'

import { AppConfig } from "@/config/config";
import { BondExpTable, Gift, GiftId, MasterData, Notifications, StudentVariant, StudentVariantId } from "@/types/MasterData";
import { getEffectivity } from "@/utils/utils";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HelpIcon from '@mui/icons-material/Help';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { Alert, InputAdornment, Tooltip } from "@mui/material";
import TextField from '@mui/material/TextField';
import Image from 'next/image';
import Link from "next/link";
import { ChangeEventHandler, useCallback, useMemo, useState } from "react";
import { ExpConverter } from "../../components/ExpConverter";
import { GiftCountForm } from "../../components/GiftCountForm";
import { StudentSelector } from "../../components/StudentSelector";
import { GoalSimulator } from "../organisms/GoalSimulator";
import { INITIAL_STUDENT_DATA, INITIAL_USER_DATA, USER_DATA_PERSIST_KEY, userDataDeserializer, userDataSchema, userDataSerializer, UserStudentData, userStudentSchema } from "@/types/UserData";
import { useLocalStorage } from 'usehooks-ts'
import z from "zod";
import { useForm } from "react-hook-form";
import ReleaseNotes from "../organisms/ReleaseNotes";

function getExpFromEffectivity(effectivity: 'normal' | 'favorite' | 'super' | 'ultra') {
  switch (effectivity) {
    case 'normal':
      return 20
    case 'favorite':
      return 40
    case 'super':
      return 60
    case 'ultra':
      return 80
    default:
      return 0
  }
}

export interface MainPageProps {
  masterData: MasterData
  bondExpTable: BondExpTable
  notifications: Notifications
}

const giftFormSchema = z.object({
  currentBondRank: userStudentSchema.shape.currentBondRank,
  goalBondRank: userStudentSchema.shape.goalBondRank,
  tailorStoneCount: userDataSchema.shape.tailorStoneCount,
})

type GiftForm = z.infer<typeof giftFormSchema>

export default function MainPage(props: MainPageProps) {
  // console.log("render")
  const { masterData, bondExpTable } = props
  /** ユーザーデータの保存 */
  const [userData, saveUserData, resetUserData] = useLocalStorage(
    USER_DATA_PERSIST_KEY,
    INITIAL_USER_DATA,
    { serializer: userDataSerializer, deserializer: userDataDeserializer })

  const [giftCountMap, setGiftCountMap] = useState(userData.giftCountMap)
  /** 選択中の生徒ID */
  const [selectedStudent, setSelectedStudent] = useState(userData.selectedStudentId)
  /** 絆ランク入力のエラー */
  const [errorMessage, setErrorMessage] = useState("")
  /** 選択中の生徒の現在の絆ランク */
  const currentBondRank = userData.students.get(selectedStudent ?? '')?.currentBondRank ?? 1
  const setCurrentBondRank = useCallback((newRank: number) => {
    if (selectedStudent && userStudentSchema.shape.currentBondRank.safeParse(newRank)) {
      const current: UserStudentData = userData.students.get(selectedStudent) ?? INITIAL_STUDENT_DATA
      const newMap = new Map(userData.students).set(selectedStudent, { ...current, currentBondRank: newRank })
      saveUserData({ ...userData, students: newMap })
    }
  }, [saveUserData, selectedStudent, userData])
  /** 選択中の生徒の目標絆ランク */
  const goalBondRank = userData.students.get(selectedStudent ?? '')?.goalBondRank ?? 100
  const setGoalBondRank = useCallback((newRank: number) => {
    if (selectedStudent && userStudentSchema.shape.goalBondRank.safeParse(newRank)) {
      const current: UserStudentData = userData.students.get(selectedStudent) ?? INITIAL_STUDENT_DATA
      const newMap = new Map(userData.students).set(selectedStudent, { ...current, goalBondRank: newRank })
      saveUserData({ ...userData, students: newMap })
    }
  }, [saveUserData, selectedStudent, userData])
  /** 上級テイラーストーン所持数 */
  const [tailorStoneCount, setTailorStoneCount] = useState(userData.tailorStoneCount ?? 0)

  /** 入力データ管理フォーム */
  const giftForm = useForm<GiftForm>({ values: { currentBondRank, goalBondRank, tailorStoneCount } })

  /** 経験値テーブルマップ (Rank => Exp) */
  const bondExpMap = useMemo(() => {
    return new Map<number, number>(bondExpTable.bondExpTable.map((v, i) => [i + 1, v]))
  }, [bondExpTable.bondExpTable])

  /** GiftId => Gift のマップ */
  const giftMap = useMemo(() => {
    return new Map<GiftId, Gift>(masterData.gifts.map(g => [g.id, g]))
  }, [masterData.gifts])

  /** StudentVariantId => StudentVariant + displayName のマップ */
  const studentMap = useMemo(() => {
    return new Map<StudentVariantId, StudentVariant & { displayName: string }>(
      masterData.students.flatMap(student =>
        student.variants.map(variant =>
          [variant.id, { ...variant, displayName: student.name + (variant.name && `（${variant.name}）`) }]))
    )
  }, [masterData.students])

  /** 該当生徒の通常贈り物反応のうち、一番大きいものの効果量 */
  const maxNormalGiftEffectivity = useMemo(() => {
    const student = studentMap.get(selectedStudent ?? "")
    if (student == undefined) {
      return "normal"
    } else if ((student.ultraFavoriteGiftIds ?? []).filter((giftId) => giftMap.get(giftId)?.type == "normal").length > 0) {
      return "ultra"
    } else if ((student.superFavoriteGiftIds ?? []).filter((giftId) => giftMap.get(giftId)?.type == "normal").length > 0) {
      return "super"
    } else if ((student.favoriteGiftIds ?? []).filter((giftId) => giftMap.get(giftId)?.type == "normal").length > 0) {
      return "favorite"
    }
    return "normal"
  }, [giftMap, selectedStudent, studentMap])

  /** 贈り物に対する生徒の効果(反応)を得る */
  const getStudentEffectivity = useCallback((gift: Gift) => {
    const student = studentMap.get(selectedStudent ?? "")
    if (student == undefined) {
      return undefined
    }
    if (gift.id == "gift-select-box") {
      // 贈り物選択ボックスの場合、該当生徒の通常贈り物反応のうち、一番大きいものに合わせる
      return maxNormalGiftEffectivity
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
  }, [studentMap, selectedStudent, maxNormalGiftEffectivity])

  /** 贈り物の数が更新された時 */
  function onGiftCountChange(id: GiftId, newValue: number) {
    giftCountMap.set(id, isNaN(newValue) ? 0 : newValue)
    const newMap = new Map(giftCountMap)
    setGiftCountMap(newMap) // hookのdeps更新検知のためMapを再作成
    // console.log(id, newMap)
    saveUserData({ ...userData, giftCountMap: newMap })
  }

  /** 生徒の選択が変更された時 */
  function onSelectedStudentChange(id?: StudentVariantId) {
    // console.log("selected student:", id, studentMap.get(id ?? "")?.name)
    setSelectedStudent(id)
    saveUserData({ ...userData, selectedStudentId: id })
  }

  /** 現在の絆ランクが変更された時のイベントハンドラ */
  const onChangeCurrentBondRank = (currentLevelStr: string) => {
    // console.log("onChangeCurrentBondRank", currentLevelStr)
    const currentRank = parseInt(currentLevelStr)
    if (isNaN(currentRank) || currentRank < 1 || currentRank > 100) {
      setErrorMessage("絆ランクは1以上100以下の整数を入力してください")
    } else {
      setErrorMessage("")
      setCurrentBondRank(currentRank)
    }
  }

  /** 目標の絆ランクが変更された時のイベントハンドラ */
  const onChangeGoalBondRank = (goalRankStr: string) => {
    // console.log("onChangeGoalBondRank", goalRankStr)
    const goalRank = parseInt(goalRankStr)
    if (isNaN(goalRank) || goalRank < 1 || goalRank > 100) {
      setErrorMessage("絆ランクは1以上100以下の整数を入力してください")
    } else {
      setErrorMessage("")
      setGoalBondRank(goalRank)
    }
  }

  const onChangeTailorStoneCount: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((e) => {
    const newValue = parseInt(e.target.value)
    if (isNaN(newValue)) {
      // TODO: エラー処理
    } else {
      setTailorStoneCount(newValue)
      saveUserData({ ...userData, tailorStoneCount: newValue })
    }
  }, [userData, saveUserData])

  /** 効果小の贈り物の数 */
  const numOfNormalEffectiveGifts = useMemo(() => {
    return masterData.gifts
      // 通常贈り物(選択ボックス以外)で、生徒反応が効果小のものを抽出
      .filter((gift) => gift.type === 'normal' && gift.id !== 'gift-select-box' && getStudentEffectivity(gift) === 'normal')
      // 所持数の総和を求める
      .reduce((accumulator: number, current: Gift) => {
        return accumulator + (giftCountMap.get(current.id) ?? 0)
      }, 0) ?? 0
  }, [getStudentEffectivity, giftCountMap, masterData.gifts])

  /** 製造可能な贈り物選択ボックスの数 */
  const numOfSelectBox = useMemo(() => Math.min(tailorStoneCount, Math.floor(numOfNormalEffectiveGifts / 2)),
    [numOfNormalEffectiveGifts, tailorStoneCount])

  /** 差引で得られる経験値 */
  const expByOptimization = useMemo(() => {
    const convertExp = getExpFromEffectivity(maxNormalGiftEffectivity)
    const extraExp = convertExp * numOfSelectBox - 20 * numOfSelectBox * 2
    return extraExp > 0 ? extraExp : 0
  }, [maxNormalGiftEffectivity, numOfSelectBox])

  /** 贈り物で得られる総経験値 */
  const expByGifts = useMemo(() =>
    giftCountMap.keys().map((giftId) => {
      const gift = giftMap.get(giftId)
      if (gift == undefined) {
        console.warn("Unknown gift id:", giftId)
        return 0;
      }
      const effectivity = getStudentEffectivity(gift)
      const exp = getEffectivity(gift, effectivity)[1]
      // console.log(`${gift.name} 効果${reaction} exp:${exp}`)
      return exp * (giftCountMap.get(giftId) ?? 0)
    }).reduce((sum, each) => sum + each, 0)
    , [getStudentEffectivity, giftCountMap, giftMap])

  /** 現在の絆ランクから贈り物経験値を合計した絆経験値 */
  const expTotal = useMemo(() => {
    if (isNaN(currentBondRank)) return undefined
    const expCurrentRank = bondExpMap.get(currentBondRank)
    if (expCurrentRank == undefined) return undefined
    return expCurrentRank + expByGifts + expByOptimization
  }, [bondExpMap, currentBondRank, expByOptimization, expByGifts])

  /** 絆ランクの期待値 */
  const calcExpectedBondRank = useMemo(() => {
    if (expTotal == undefined || bondExpTable.bondExpTable == undefined) return undefined

    return bondExpTable.bondExpTable.findLastIndex((v) => v <= expTotal) + 1
  }, [bondExpTable.bondExpTable, expTotal])

  /** 次のランクまで必要な経験値 */
  const requiredExpToNextRank = useMemo<[number, number] | undefined>(() => {
    if (calcExpectedBondRank == undefined
      || expTotal == undefined
      || calcExpectedBondRank < 1
      || calcExpectedBondRank >= 100
      || calcExpectedBondRank >= goalBondRank) return undefined
    const nextLevelExp = bondExpTable.bondExpTable[calcExpectedBondRank]
    if (nextLevelExp == undefined) return undefined
    return [calcExpectedBondRank + 1, nextLevelExp - expTotal]
  }, [calcExpectedBondRank, expTotal, goalBondRank, bondExpTable.bondExpTable])

  /** 目標のランクまで必要な経験値 */
  const requiredExpToGoalRank = useMemo(() => {
    if (expTotal == undefined) return undefined
    const goalLevelExp = bondExpTable.bondExpTable[goalBondRank - 1]
    if (goalLevelExp == undefined) return undefined
    const requiredExp = goalLevelExp - expTotal
    return requiredExp <= 0 ? undefined : requiredExp
  }, [expTotal, goalBondRank, bondExpTable.bondExpTable])

  /** 未読のお知らせリスト */
  const unreadNotifications = useMemo(() => {
    return props.notifications.filter(n => n.index > userData.lastReadNotification)
  }, [props.notifications, userData.lastReadNotification])

  /** お知らせを既読にする */
  const markReadNotification = useCallback(() => {
    saveUserData({ ...userData, lastReadNotification: Math.max(...unreadNotifications.map(n => n.index)) })
  }, [saveUserData, unreadNotifications, userData])

  return (
    <main className="flex w-full max-w-6xl flex-col items-center justify-between py-8 px-4 sm:px-16 bg-white sm:items-start">
      <h1 className="text-xl mb-4 pb-1 border-b-2 border-red-200 w-full">ブルアカ 絆ランクシミュレータ</h1>
      <p>
        所有している贈り物・製造用アイテムの数から到達できる絆ランクを計算します。
      </p>
      {unreadNotifications.length > 0 ? (
        <Alert severity="info" onClose={markReadNotification} className="w-full">
          {unreadNotifications.map((n) => {
            return <p key={`notification-${n.index}`}>
              {n.publishDate}: {n.message}
            </p>
          })}
        </Alert>
      ) : undefined}
      {/* 生徒の選択 */}
      <div id="student-selector" className="my-2">
        生徒を選択: <StudentSelector students={masterData.students ?? []} onChange={onSelectedStudentChange} initialValue={userData.selectedStudentId} />
      </div>
      <p className="text-xs">
        ゲーム内のメニュー「アイテム」→フィルター「贈り物」→ソート「デフォルト」で所持している贈り物数を調べられます。PCではTabキーで入力欄を移動できます。
      </p>
      {/* 贈り物の数を入力するフォーム */}
      {/* grid-cols-5 gap-2 */}
      <div id="gift-count-form" className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-10 gap-2">
        {masterData.gifts.map((gift) =>
          <GiftCountForm key={`gift-form-${gift.id}`} gift={gift} effectivity={getStudentEffectivity(gift)} onChange={onGiftCountChange} initialValue={giftCountMap.get(gift.id)} />
        )}
      </div>
      {/* 上級テイラーストーンを入力するフォーム */}
      <div className="border-2 border-gray-200 w-full rounded-lg p-2 mt-2 text-sm">
        <p>
          贈り物選択ボックス変換
          &nbsp;
          <Tooltip title="効果小の贈り物×２と上級テイラーストーンを使ってテイラーメイドから贈り物選択ボックスを製造し、効果大の贈り物に変換することで獲得できる絆経験値をアップするテクニックです。" arrow placement="right"><HelpIcon fontSize="small" className="align-bottom text-gray-500" /></Tooltip>
        </p>
        {selectedStudent && (maxNormalGiftEffectivity == "normal" || maxNormalGiftEffectivity == "favorite") ?
          <div className="mt-2 text-red-600">
            「{studentMap.get(selectedStudent)?.displayName}」は選択ボックスで交換できる贈り物で効果大以上のものがないため、変換の効果がありません
          </div>
          :
          <div className="mt-2 flex items-center gap-2">
            <TextField variant="standard" label="上級テイラーストーン数" className="w-36" type="number"
              {...giftForm.register('tailorStoneCount', { onChange: onChangeTailorStoneCount })}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Image width={36} height={36} src={`${AppConfig.assetBaseUrl}/other/tailor-stone.png`} alt="上級テイラーストーン" />
                    </InputAdornment>
                  )
                }
              }} />
            <AddCircleOutlineIcon className="block" />
            <div>
              消費する贈り物(効果小)数: {numOfSelectBox * 2}<br />
              (所持数: {numOfNormalEffectiveGifts})
            </div>
            <KeyboardDoubleArrowRightIcon className="block" />
            <div>
              製造できる<Image className="inline-block" width={30} height={30} src={`${AppConfig.assetBaseUrl}/gift/gift-select-box.png`} alt="贈り物選択ボックス" />数: {numOfSelectBox}
            </div>
            <KeyboardDoubleArrowRightIcon className="block" />
            <div>
              差引で得られる経験値: {expByOptimization}
            </div>
          </div>
        }
      </div>
      <div id="gift-total-score" className="my-4 text-sm">
        現在の絆ランクの経験値 {bondExpMap.get(currentBondRank) ?? "-"}
        &nbsp;&nbsp;+&nbsp;&nbsp;
        贈り物で得られる絆経験値 {expByGifts}
        {expByOptimization > 0 && <>
          &nbsp;&nbsp;+&nbsp;&nbsp;
          選択ボックス変換で得られる追加経験値 {expByOptimization}
        </>}
        &nbsp;&nbsp;=&nbsp;&nbsp;
        総絆経験値 {expTotal ?? "-"}
      </div>
      {/* 現在の絆ランクと、アイテムで到達できる絆ランクを表示 */}
      <div id="bond-level-indicator" className="flex items-baseline gap-2 w-full justify-center">
        <TextField variant="standard" label="現在の絆ランク" className="w-30" type="number"
          {...giftForm.register('currentBondRank', { onChange: (e) => onChangeCurrentBondRank(e.target.value) })}
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
          value={(errorMessage || !calcExpectedBondRank) && "-" || calcExpectedBondRank}
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
          {...giftForm.register('goalBondRank', { onChange: (e) => onChangeGoalBondRank(e.target.value) })}
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
      {requiredExpToNextRank &&
        <div className="mt-4 text-sm">
          次のランク<FavoriteIcon className="text-red-300" fontSize="inherit" />{requiredExpToNextRank[0]} までに必要な経験値(=絆ポイント): <ExpConverter exp={requiredExpToNextRank[1]} />
        </div>
      }
      {requiredExpToGoalRank &&
        <div className="mt-2 text-sm">
          目標のランク<FavoriteIcon className="text-red-300" fontSize="inherit" />{goalBondRank} までに必要な経験値(=絆ポイント): <ExpConverter exp={requiredExpToGoalRank} />
        </div>
      }

      {requiredExpToGoalRank && expTotal != undefined ?
        <GoalSimulator currentExp={expTotal} goalRank={goalBondRank} bondExpTable={bondExpTable.bondExpTable} maxNormalGiftExp={getExpFromEffectivity(maxNormalGiftEffectivity)} />
        : undefined
      }

      <div className="mt-4 pt-4 border-t-2 border-red-200 w-full text-sm">
        ※ブラウザにのみデータを保存しています。ブラウザのキャッシュ等をクリアすると値は初期化されます。<br />
        Contact(バグ報告などはこちらへ): @zeroichi
        &nbsp;
        <Link className="text-blue-600" href="https://x.com/zeroichi" target="_blank" rel="noopener">X (Twitter)</Link>
        &nbsp;/&nbsp;
        <Link className="text-blue-600" href="https://github.com/zeroichi/ba-kizuna-calc" target="_blank" rel="noopener">GitHub</Link>
        &nbsp;
        (<Link className="text-blue-600" href="https://github.com/zeroichi/ba-kizuna-calc/issues" target="_blank" rel="noopener">対応予定Issue</Link>)
      </div>
      <ReleaseNotes />
    </main>
  );
}
