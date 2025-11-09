import { AppConfig } from "@/config/config"
import { Gift, GiftEffectivity, GiftId } from "@/types/master"
import { getEffectivity, getEffectivityId } from "@/utils/utils"
import { Tooltip } from "@mui/material"
import Image from 'next/image'
export interface GiftCountFormProps {
  /** 贈り物情報 */
  gift: Gift
  /** 個数が変更された時のイベントハンドラ */
  onChange?: (id: GiftId, newValue: number) => void
  /** 効果: 小、中、大、特大 (生徒ごとに変える。指定しない場合は通常=小、高級=中扱い) */
  effectivity?: GiftEffectivity
}

export const GiftCountForm = (props: GiftCountFormProps) => {
  // const typeText = props.gift.type in ["high", "high-all"] ? "高級" : "通常"

  const [effectivity, exp] = getEffectivity(props.gift, props.effectivity)

  return <div className="border-1 border-gray-400 rounded-lg p-2 text-sm">
    <div className="flex flex-row">
      <Tooltip title={props.gift.name} arrow placement="top">
        <Image width={48} height={48} src={`${AppConfig.assetBaseUrl}/gift/${props.gift.id}.png`} alt={props.gift.name} />
      </Tooltip>
      <div className="flex flex-col space-x-2">
        <Image width={20} height={20} src={`${AppConfig.assetBaseUrl}/reaction/${getEffectivityId(effectivity)}.png`} alt={props.gift.name} />
        <span className="text-xs">{exp}</span>
      </div>
    </div>
    {/* <span className="text-xs">{props.gift.name}</span><br /> */}
    {/* <span className="text-xs border-1 border-gray-200 bg-gray-200 rounded-md p-1">({typeText}, 効果{effectivity}, {exp})</span><br /> */}
    ×
    <input type="number" placeholder="0" className="w-15 px-1 border border-gray-200 rounded-lg"
      onChange={(e) => props.onChange?.(props.gift.id, parseInt(e.target.value))} />
  </div>
}
