import { Gift, GiftEffectivity } from "@/types/MasterData"

/** 贈り物と生徒への効果(反応)から、効果量を表す文字列と1つあたり絆経験値を得る */
export function getEffectivity(gift: Gift, effectivity?: GiftEffectivity): [string, number] {
  if (gift.type == "high-all") {
    return ["特大", 240]
  } else if (gift.type == "normal-all") {
    return ["大", 60]
  } else if (gift.type == "high") {
    switch (effectivity) {
      case "super":
        return ["大", 180]
      case "ultra":
        return ["特大", 240]
      default:
        return ["中", 120]
    }
  } else if (gift.type == "normal") {
    switch (effectivity) {
      case "favorite":
        return ["中", 40]
      case "super":
        return ["大", 60]
      case "ultra":
        return ["特大", 80]
      default:
        return ["小", 20]
    }
  }
  return ["？", 0]
}

export function getEffectivityId(effectivity: string): string {
  switch(effectivity) {
    case "小":
      return "normal"
    case "中":
      return "favorite"
    case "大":
      return "super"
    case "特大":
      return "ultra"
    default:
      return "unknown"
  }
}
