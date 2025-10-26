import { Gift, GiftId } from "@/types/master"

export interface GiftCountFormProps {
  gift: Gift
  onChange?: (id: GiftId, newValue: number) => void
  effective?: "normal" | "favorite" | "super"
}

export const GiftCountForm = (props: GiftCountFormProps) => {
  return <div className="border-1 p-2 text-sm">
    <span className="text-xs">{props.gift.name}</span><br />
    ×
    <input type="number" placeholder="0" className="w-15 px-1 border border-gray-200 rounded-lg"
      onChange={(e) => props.onChange?.(props.gift.id, parseInt(e.target.value))} />
  </div>
}
