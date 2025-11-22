/** 経験値をアイテム個数やカフェタッチ回数などに換算して表示するコンポーネント */

import { useState } from "react"
import CloseIcon from '@mui/icons-material/Close';

export interface ExpConverterProps {
  exp: number
}

export const ExpConverter = (props: ExpConverterProps) => {
  const [visible, setVisible] = useState(false)
  return <>
    <span className="underline decoration-dotted underline-offset-4 cursor-pointer text-blue-600" onClick={() => setVisible(!visible)}>
      {props.exp}
    </span>
    {visible && <div className="border-1 rounded-lg my-1 p-2">
      <p>経験値(=絆ポイント) {props.exp} は...</p>
      <ul className="list-disc ml-6">
        <li>カフェタッチ(15exp)換算: {Math.ceil(props.exp / 15)}回</li>
        <li>スケジュール(ロケーションLvMax, 25exp)換算: {Math.ceil(props.exp / 25)}回</li>
        <li>スケジュール BONUS(ロケーションLvMax, 50exp)換算: {Math.ceil(props.exp / 50)}回</li>
        <li>通常贈り物(効果小, 20exp)換算:    {Math.ceil(props.exp / 20)}個</li>
        <li>通常贈り物(効果中, 40exp)換算:    {Math.ceil(props.exp / 40)}個</li>
        <li>通常贈り物(効果大, 60exp)換算:    {Math.ceil(props.exp / 60)}個</li>
        <li>通常贈り物(効果特大, 80exp)換算:  {Math.ceil(props.exp / 80)}個</li>
        <li>高級贈り物(効果中, 120exp)換算:   {Math.ceil(props.exp / 120)}個</li>
        <li>高級贈り物(効果大, 180exp)換算:   {Math.ceil(props.exp / 180)}個</li>
        <li>高級贈り物(効果特大, 240exp)換算: {Math.ceil(props.exp / 240)}個</li>
      </ul>
      <p className="underline decoration-dotted underline-offset-4 cursor-pointer text-blue-600 text-right"
        onClick={() => setVisible(false)}>
        <CloseIcon fontSize="inherit" /> 閉じる
      </p>
    </div> || undefined}
  </>
}
