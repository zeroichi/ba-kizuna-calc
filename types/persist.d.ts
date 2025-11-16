import { StudentVariantId } from "./master"

export interface PersistData {
  giftCountMap: {[k: string]: number}
  currentBondLevel: number
  selectedStudentId?: StudentVariantId
}
