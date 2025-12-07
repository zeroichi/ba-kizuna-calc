import z from "zod"
import { notificationsSchema } from "./MasterData"

/** ストレージ保存時のキー */
export const USER_DATA_PERSIST_KEY = 'persist-data'

/** ユーザーの生徒情報のスキーマ定義 */
export const userStudentSchema = z.object({
  /** 絆上げ対象生徒か */
  isTarget: z.boolean(),
  /** 生徒の現在の絆ランク */
  currentBondRank: z.int().min(1).max(100),
  /** 生徒の目標絆ランク */
  goalBondRank: z.int().min(1).max(100),
})

export type UserStudentData = z.infer<typeof userStudentSchema>

export const INITIAL_STUDENT_DATA: UserStudentData = {
  isTarget: true,
  currentBondRank: 1,
  goalBondRank: 100,
}

/** ユーザーデータのスキーマ定義 */
export const userDataSchema = z.object({
  /** 贈り物の所持数(key=GiftId, value=所持数) */
  giftCountMap: z.map(z.string(), z.int().min(0)),
  /** 生徒ごとの情報(key=StudentVariantId) */
  students: z.map(z.string(), userStudentSchema),
  /** 選択中の生徒(StudentVariantId) */
  selectedStudentId: z.string().optional(),
  /** 上級ストーン数 */
  tailorStoneCount: z.int().min(0),
  /** 既読のお知らせメッセージバージョン */
  lastReadNotification: notificationsSchema.element.shape.index,
})

/** ユーザーデータ */
export type UserData = z.infer<typeof userDataSchema>

/** ユーザーデータの初期値 */
export const INITIAL_USER_DATA: UserData = {
  giftCountMap: new Map(),
  students: new Map(),
  selectedStudentId: undefined,
  tailorStoneCount: 0,
  lastReadNotification: 0,
}

/** UserData型をJSONにするシリアライザ */
export function userDataSerializer(userData: UserData): string {
  return JSON.stringify({
    ...userData,
    giftCountMap: Object.fromEntries(userData.giftCountMap),
    students: Object.fromEntries(userData.students),
  })
}

/** JSONをUserData型にするデシリアライザ */
export function userDataDeserializer(json: string): UserData {
  const obj = JSON.parse(json, (key, value) => {
    // Map型への復元
    if (['giftCountMap', 'students'].includes(key)) {
      return new Map<string, number>(Object.entries(value))
    }
    return value
  })
  // console.log("deserialized data:", obj)
  return {...INITIAL_USER_DATA, ...obj} as UserData
}
