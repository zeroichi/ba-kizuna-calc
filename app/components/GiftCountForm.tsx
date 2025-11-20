import { AppConfig } from "@/config/config"
import { Gift, GiftEffectivity, GiftId } from "@/types/master"
import { getEffectivity, getEffectivityId } from "@/utils/utils"
import { Tooltip } from "@mui/material"
import Image from 'next/image'
import { ChangeEventHandler, useState } from "react"
export interface GiftCountFormProps {
  /** 贈り物情報 */
  gift: Gift
  /** 個数が変更された時のイベントハンドラ */
  onChange?: (id: GiftId, newValue: number) => void
  /** 効果: 小、中、大、特大 (生徒ごとに変える。指定しない場合は通常=小、高級=中扱い) */
  effectivity?: GiftEffectivity
  /** 初期値(保存から復元した場合など) */
  initialValue?: number
}

export const GiftCountForm = (props: GiftCountFormProps) => {
  const [current, setCurrent] = useState(props.initialValue?.toString() ?? "0")
  const [effectivity, exp] = getEffectivity(props.gift, props.effectivity)
  const [hasError, setError] = useState(false)

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const newValue = parseInt(e.target.value)
    if (isNaN(newValue)) {
      setError(true)
    } else {
      setError(false)
    }
    props.onChange?.(props.gift.id, newValue)
    setCurrent(e.target.value)
  }

  // 高級贈り物か否か
  const isHighGift = props.gift.type == 'high' || props.gift.type == 'high-all'

  return <div className={`border-1 border-gray-400 rounded-lg p-2 text-sm ${isHighGift ? 'bg-purple-100' : 'bg-gray-50'}`}>
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
    <input type="number" placeholder="0" className={`w-15 px-1 border ${hasError ? "border-red-900" : isHighGift ? 'border-purple-300' : 'border-gray-300'} rounded-lg`}
      value={current} onChange={handleOnChange} />
  </div>
}
