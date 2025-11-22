import { StudentVariantId } from "./master"

export interface PersistData {
  giftCountMap: {[k: string]: number}
  currentBondLevel: number
  goalBondLevel?: number
  selectedStudentId?: StudentVariantId
  tailorStoneCount?: number
}
