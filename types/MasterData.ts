import z from "zod"

/** 学校 */
export type SchoolId = string
export interface School {
  id: SchoolId
  name: string
}

/** 贈り物 */
export type GiftId = string
export type GiftType = "normal" | "high" | "normal-all" | "high-all"
export interface Gift {
  id: GiftId
  name: string
  type: GiftType
}

/** 生徒の衣装違い */
export type StudentVariantId = string
export interface StudentVariant {
  /** 衣装違いを一意に識別するID */
  id: StudentVariantId
  /** 衣装名。通常衣装の場合は空文字列 */
  name: string
  /** 効果中の贈り物 ※通常の高級贈り物は除く */
  favoriteGiftIds?: GiftId[]
  /** 効果大の贈り物 */
  superFavoriteGiftIds?: GiftId[]
  /** 効果特大の贈り物 ※通常贈り物では水着ハナコ・正月ムツキのみ */
  ultraFavoriteGiftIds?: GiftId[]
}

/** 生徒 */
export interface Student {
  /** 生徒名(下の名前のみ) */
  name: string
  /** 生徒フルネーム(名字+名前) */
  fullName: string
  /** 所属学校ID */
  schoolId: SchoolId
  /** 各衣装 */
  variants: StudentVariant[]
}

/** マスターデータ全体(students.yamlに対応) */
export interface MasterData {
  schools: School[]
  gifts: Gift[]
  students: Student[]
}

/** 経験値テーブル(bondTable.yamlに対応) */
export interface BondExpTable {
  bondExpTable: number[]
}

/** 贈り物の効果(生徒の反応) 小・中・大・特大 */
export type GiftEffectivity = "normal" | "favorite" | "super" | "ultra"

/** お知らせ表示アイテムのスキーマ */
export const notificationsSchema = z.array(
  z.object({
    index: z.int(),
    publishDate: z.string(),
    message: z.string(),
  })
)

/** お知らせ表示アイテム */
export type Notifications = z.infer<typeof notificationsSchema>
