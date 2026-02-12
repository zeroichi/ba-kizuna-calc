/** カフェタッチやスケジュールなどを行い、何日後に目標絆ランクに達するかのシミュレータ */

import { Button, Snackbar, TextField } from "@mui/material"
import dayjs, { Dayjs } from "dayjs"
import { useCallback, useState } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useLocalStorage } from "usehooks-ts";

export interface GoalSimulatorProps {
  currentExp: number
  goalRank: number
  bondExpTable: number[]
  maxNormalGiftExp: number
}

/** シミュレーションパラメータ */
type SimulationParams = {
  /** 1日のカフェタッチ回数 */
  cafePerDay: number
  /** 1日のスケジュール回数 */
  schedulePerDay: number
  /** スケジュールでBONUSになる確率 */
  scheduleBonusPercent: number
  /** 1日で製造する贈り物数 */
  giftsPerDay: number
  /** その内、高級贈り物になる確率 */
  fancyGiftPercent: number
  /** 1回のイベントで貰える通常贈り物数 */
  normalGiftsPerEvent: number
  /** 1回のイベントで貰える高級贈り物数 */
  fancyGiftsPerEvent: number
  /** 月のイベント開催日(1) */
  dayOfEvent1: number
  /** 月のイベント開催日(2) */
  dayOfEvent2: number
  /** 制約解除決戦 攻略段階 */
  unrestrictedFloor: number
  /** 制約解除決戦 攻略日 */
  dayOfUnrestricted: number
  /** 贈り物セット月一パッケージをいくつ購入するか */
  numGiftPackage: number
  /** 贈り物セット月一パッケージ 購入(使用)日 */
  dayOfGiftPackage: number
  /** 製造用月一パッケージをいくつ購入するか */
  numProducePackage: number
  /** 製造用月一パッケージ 購入(使用)日 */
  dayOfProducePackage: number
}

const INITIAL_SIMULATION_PARAMS: SimulationParams = {
  cafePerDay: 5,
  schedulePerDay: 0.5,
  scheduleBonusPercent: 25,
  giftsPerDay: 3,
  fancyGiftPercent: 10,
  normalGiftsPerEvent: 40,
  fancyGiftsPerEvent: 2,
  dayOfEvent1: 5,
  dayOfEvent2: 15,
  unrestrictedFloor: 75,
  dayOfUnrestricted: 15,
  numGiftPackage: 0,
  dayOfGiftPackage: 1,
  numProducePackage: 0,
  dayOfProducePackage: 1,
}

const PERSIST_KEY = "simulation-params";

type SimulatedDay = {
  day: number
  date: Dayjs
  events: string[]
  exp: number
  totalExp: number
  bondRank: number
}

export const GoalSimulator = (props: GoalSimulatorProps) => {
  const [savedData, setSavedData] = useLocalStorage(PERSIST_KEY, INITIAL_SIMULATION_PARAMS)
  const [notifyMessage, setNotifyMessage] = useState<string>()
  const [simulrationResult, setSimulrationResult] = useState<SimulatedDay[]>([])

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<SimulationParams>({
    defaultValues: savedData
  })

  /** 絆ランクの期待値 */
  const calcExpectedBondRank = useCallback((exp: number) => {
    return props.bondExpTable.findLastIndex((v) => v <= exp) + 1
  }, [props.bondExpTable])

  const onSubmit: SubmitHandler<SimulationParams> = useCallback(async (params) => {
    setSimulrationResult([])
    const today = dayjs(new Date())
    const result: SimulatedDay[] = []
    let currentExp = props.currentExp
    for (let i = 1; i < 365 * 2; ++i) {
      const currentDay = today.add(i, 'day')
      let expGot = 0
      const events: string[] = []
      // カフェタッチ
      if (params.cafePerDay > 0) {
        const e = 15 * params.cafePerDay
        expGot += e
        events.push(`カフェタッチ(${e}P)`)
      }
      // スケジュール
      if (params.schedulePerDay > 0) {
        const bonusProbability = params.scheduleBonusPercent / 100.0
        const e = params.schedulePerDay * bonusProbability * 50 + params.schedulePerDay * (1 - bonusProbability) * 25
        expGot += e
        events.push(`スケジュール(期待値${e}P)`)
      }
      // 贈り物製造
      if (params.giftsPerDay > 0) {
        const fancyProbability = params.fancyGiftPercent / 100.0
        // TODO: 生徒に合わせて修正
        const e = params.giftsPerDay * fancyProbability * 120 + params.giftsPerDay * (1 - fancyProbability) * 20
        expGot += e
        events.push(`贈り物製造(期待値${e}P)`)
      }
      // イベント(1)
      if (currentDay.get('date') == params.dayOfEvent1) {
        // TODO: 生徒に合わせて修正
        const e1 = params.normalGiftsPerEvent * 20
        expGot += e1
        events.push(`イベント(1)報酬 通常贈り物(期待値${e1}P)`)
        const e2 = params.fancyGiftsPerEvent * 120
        expGot += e2
        events.push(`イベント(1)報酬 高級贈り物(期待値${e2}P)`)
      }
      // イベント(2)
      if (currentDay.get('date') == params.dayOfEvent2) {
        // TODO: 生徒に合わせて修正
        const e1 = params.normalGiftsPerEvent * 20
        expGot += e1
        events.push(`イベント(2)報酬 通常贈り物(期待値${e1}P)`)
        const e2 = params.fancyGiftsPerEvent * 120
        expGot += e2
        events.push(`イベント(2)報酬 高級贈り物(期待値${e2}P)`)
      }
      // 制約解除決戦
      if (currentDay.get('date') == params.dayOfUnrestricted && params.unrestrictedFloor > 0) {
        if (params.unrestrictedFloor >= 19) {
          const e1 = props.maxNormalGiftExp * 2
          expGot += e1
          events.push(`制約解除決戦 19F報酬 贈り物選択ボックスx2(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 39) {
          const e1 = props.maxNormalGiftExp * 2
          expGot += e1
          events.push(`制約解除決戦 39F報酬 贈り物選択ボックスx2(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 49) {
          // TODO: 生徒に合わせて修正
          const e1 = 120
          expGot += e1
          events.push(`制約解除決戦 49F報酬 高級贈り物抽選ボックス(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 79) {
          const e1 = props.maxNormalGiftExp * 2
          expGot += e1
          events.push(`制約解除決戦 79F報酬 贈り物選択ボックスx2(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 90) {
          // TODO: 生徒に合わせて修正
          const e1 = 120
          expGot += e1
          events.push(`制約解除決戦 90F報酬 高級贈り物抽選ボックス(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 99) {
          // TODO: 生徒に合わせて修正
          const e1 = 120
          expGot += e1
          events.push(`制約解除決戦 99F報酬 高級贈り物抽選ボックス(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 105) {
          const e1 = props.maxNormalGiftExp * 2
          expGot += e1
          events.push(`制約解除決戦 105F報酬 贈り物選択ボックスx2(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 106) {
          // TODO: 生徒に合わせて修正
          const e1 = 120
          expGot += e1
          events.push(`制約解除決戦 106F報酬 高級贈り物抽選ボックス(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 111) {
          const e1 = props.maxNormalGiftExp * 2
          expGot += e1
          events.push(`制約解除決戦 111F報酬 贈り物選択ボックスx2(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 112) {
          // TODO: 生徒に合わせて修正
          const e1 = 120
          expGot += e1
          events.push(`制約解除決戦 112F報酬 高級贈り物抽選ボックス(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 117) {
          const e1 = props.maxNormalGiftExp * 2
          expGot += e1
          events.push(`制約解除決戦 117F報酬 贈り物選択ボックスx2(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 118) {
          // TODO: 生徒に合わせて修正
          const e1 = 120
          expGot += e1
          events.push(`制約解除決戦 118F報酬 高級贈り物抽選ボックス(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 123) {
          const e1 = props.maxNormalGiftExp * 2
          expGot += e1
          events.push(`制約解除決戦 123F報酬 贈り物選択ボックスx2(${e1}P)`)
        }
        if (params.unrestrictedFloor >= 124) {
          // TODO: 生徒に合わせて修正
          const e1 = 120
          expGot += e1
          events.push(`制約解除決戦 124F報酬 高級贈り物抽選ボックス(${e1}P)`)
        }
      }
      // 月一贈り物PKG
      if (params.numGiftPackage > 0 && currentDay.get('date') == params.dayOfGiftPackage) {
        // TODO: 生徒に合わせて修正
        const e = (20 * 10 + props.maxNormalGiftExp * 5 + 120) * params.numGiftPackage
        expGot += e
        events.push(`贈り物セット月一パッケージ 贈り物ボックスx${10 * params.numGiftPackage} (${200 * params.numGiftPackage}P)`)
        events.push(`贈り物セット月一パッケージ 贈り物選択ボックスx${5 * params.numGiftPackage} (${props.maxNormalGiftExp * 5 * params.numGiftPackage}P)`)
        events.push(`贈り物セット月一パッケージ 高級贈り物ボックスx${1 * params.numGiftPackage} (${120 * params.numGiftPackage}P)`)
      }
      // 月一製造PKG
      if (params.numProducePackage > 0 && currentDay.get('date') == params.dayOfProducePackage) {
        const e = props.maxNormalGiftExp * 15 * params.numProducePackage
        expGot += e
        events.push(`製造用月一パッケージ 贈り物選択ボックスx${15 * params.numProducePackage}(${e}P)`)
      }
      currentExp += expGot
      result.push({
        day: i,
        date: currentDay,
        events,
        exp: expGot,
        totalExp: currentExp,
        bondRank: calcExpectedBondRank(currentExp)
      })
      // 目標絆レベルに達したらシミュレーション停止
      if (calcExpectedBondRank(currentExp) >= props.goalRank) {
        break
      }
    }
    setSimulrationResult(result)
  }, [props.currentExp, calcExpectedBondRank, props.maxNormalGiftExp, props.goalRank])

  const onSave: SubmitHandler<SimulationParams> = (params) => {
    setSavedData(params)
    setNotifyMessage("設定をブラウザに保存しました")
    reset(params)
  }

  return <>
    <style>
      {/* 入力欄で右寄せにする */}
      {`
      .input-form input {
        text-align: right;
      }
    `}
    </style>
    <h2 className="mt-4 pt-4 border-t-2 border-red-200 w-full font-bold">達成日のシミュレーション【β版】</h2>
    <p className="mt-2 text-sm">
      毎日行うカフェタッチやスケジュールなどから、何日後に目標絆ランクに達するかのシミュレーションを行います。
    </p>
    <div className="text-sm">
      <table className="border-separate border-0 border-spacing-x-4 border-spacing-y-2">
        <tbody>
          <tr>
            <th>1日のカフェタッチ回数</th>
            <td className="align-bottom">
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    endAdornment: (<span className="text-nowrap text-sm pl-1">回/日</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("cafePerDay")}
              />
            </td>
          </tr>
          <tr>
            <th>1日のスケジュール回数</th>
            <td className="flex space-x-10">
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    endAdornment: (<span className="text-nowrap text-sm pl-1">回/日</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("schedulePerDay")}
              />
            </td>
            <th>
              ボーナス発生確率
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    endAdornment: (<span className="text-nowrap text-sm pl-1">％</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("scheduleBonusPercent")}
              />
            </td>
          </tr>
          <tr>
            <th>1日の贈り物製造数</th>
            <td className="flex space-x-10">
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    endAdornment: (<span className="text-nowrap text-sm pl-1">個/日</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("giftsPerDay")}
              />
            </td>
            <th>
              内、高級贈り物確率
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    endAdornment: (<span className="text-nowrap text-sm pl-1">％</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("fancyGiftPercent")}
              />
            </td>
          </tr>
          <tr>
            <th>
              イベント通常贈り物報酬
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    endAdornment: (<span className="text-nowrap text-sm pl-1">個/回</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("normalGiftsPerEvent")}
              />
            </td>
            <th>
              イベント高級贈り物報酬
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    endAdornment: (<span className="text-nowrap text-sm pl-1">個/回</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("fancyGiftsPerEvent")}
              />
            </td>
          </tr>
          <tr>
            <th>
              イベント開催(1)
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    startAdornment: (<span className="text-nowrap text-sm">毎月</span>),
                    endAdornment: (<span className="text-nowrap text-sm pl-1">日</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("dayOfEvent1")}
              />
            </td>
            <th>
              イベント開催(2)
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    startAdornment: (<span className="text-nowrap text-sm">毎月</span>),
                    endAdornment: (<span className="text-nowrap text-sm pl-1">日</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("dayOfEvent2")}
              />
            </td>
          </tr>
          <tr>
            <th>
              制約解除決戦 報酬
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    endAdornment: (<span className="text-nowrap text-sm pl-1">Fまで</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("unrestrictedFloor")}
              />
            </td>
            <th>
              制約解除決戦 攻略日
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    startAdornment: (<span className="text-nowrap text-sm">毎月</span>),
                    endAdornment: (<span className="text-nowrap text-sm pl-1">日</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("dayOfUnrestricted")}
              />
            </td>
          </tr>
          <tr>
            <th>
              【課金】贈り物セット月一PKG<br />
              (0は購入なし)
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    startAdornment: (<span className="text-nowrap text-sm">毎月</span>),
                    endAdornment: (<span className="text-nowrap text-sm pl-1">回</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("numGiftPackage")}
              />
            </td>
            <th>
              購入(使用)日
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    startAdornment: (<span className="text-nowrap text-sm">毎月</span>),
                    endAdornment: (<span className="text-nowrap text-sm pl-1">日</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("dayOfGiftPackage")}
              />
            </td>
          </tr>
          <tr>
            <th>
              【課金】製造用月一PKG<br />
              (0は購入なし)
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    startAdornment: (<span className="text-nowrap text-sm">毎月</span>),
                    endAdornment: (<span className="text-nowrap text-sm pl-1">回</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("numProducePackage")}
              />
            </td>
            <th>
              購入(使用)日
            </th>
            <td>
              <TextField variant="standard" className="w-24 input-form"
                slotProps={{
                  input: {
                    startAdornment: (<span className="text-nowrap text-sm">毎月</span>),
                    endAdornment: (<span className="text-nowrap text-sm pl-1">日</span>),
                    style: { textAlign: "right" }
                  }
                }}
                {...register("dayOfProducePackage")}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div>
        <ul className="list-disc ml-6 text-sm text-gray-600">
          <li>上で入力している現在の絆ポイント/絆ランクと目標ランクを引き継いでシミュレーションします。</li>
          <li>全て期待値で計算されます。(実際に抽選等をして決めるわけではありません)</li>
          <li>製造の高級贈り物確率はデフォルトで適当な設定(10%)です。適宜調整してください。</li>
          {/* <li>贈り物で得られる絆ポイント(絆経験値)は生徒の好みを考慮して平均値を使用します。</li> */}
          <li>贈り物で得られる絆ポイント(絆経験値)は現状通常贈り物=20p, 高級贈り物=120pで固定です。(今後生徒の好みの平均を取るよう改良予定)</li>
          <li>スケジュールは全ロケーションランクMAXが前提です(ベース絆ポイント25)。</li>
          <li>イベントは月2回開催を想定しています。イベント報酬を無効にするには開催日を「0」にしてください。</li>
          <li>シミュレーションは最大で2年先までです。目標絆ランクに達したらそこで終了します。</li>
          <li>製造用月一PKGはテイラーストーン+製造用マテリアルで製造できる贈り物選択ボックスのみ考慮します。(キーストーンは考慮外)</li>
        </ul>
      </div>
      <div className="mt-2">
        <Button variant="contained" onClick={handleSubmit(onSubmit)}>シミュレーション実行</Button>
        &nbsp;
        <Button variant="contained" onClick={handleSubmit(onSave)} color="secondary" disabled={!isDirty}>設定保存</Button>
      </div>
      {simulrationResult && simulrationResult.length > 0 &&
        <div className="mt-2">
          <h3 className="text-lg text-blue-600">シミュレーション結果</h3>
          <table className="sim-result border border-separate border-spacing-0">
            <tbody>
              <tr>
                <th>日数</th>
                <th>日付</th>
                <th>イベント</th>
                <th>獲得絆P</th>
                <th>累計絆P</th>
                <th>絆ランク</th>
              </tr>
              {
                simulrationResult.map((sd) => <tr key={`result-day-${sd.day}`}>
                  <td className="border-b-2 border-gray-300 p-2">{sd.day}</td>
                  <td className="border-b-2 border-gray-300 p-2">{sd.date.format("YYYY/MM/DD(ddd)")}</td>
                  <td className="border-b-2 border-gray-300 p-2">
                    <ul className="list-disc ml-6 text-sm text-gray-600">
                      {sd.events.map((event, i) => <li key={`result-day-${sd.day}-event-${i}`}>
                        {event}
                      </li>)}
                    </ul>
                  </td>
                  <td className="border-b-2 border-gray-300 p-2">{sd.exp}</td>
                  <td className="border-b-2 border-gray-300 p-2">{Math.floor(sd.totalExp)}</td>
                  <td className="border-b-2 border-gray-300 p-2"><FavoriteIcon className="text-red-300" />{Math.floor(sd.bondRank)}</td>
                </tr>)
              }
            </tbody>
          </table>
        </div>
      }
    </div>
    <Snackbar
      open={notifyMessage != undefined}
      autoHideDuration={5000}
      onClose={() => setNotifyMessage(undefined)}
      message={notifyMessage}
    />
  </>
}
