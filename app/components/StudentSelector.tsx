'use client'

import { Student, StudentVariantId } from "@/types/MasterData"
import { UserStudentData } from "@/types/UserData"
import { ReactNode, useMemo, useState } from "react"
import Select, { FilterOptionOption, StylesConfig } from "react-select"
import BondRank from "./atoms/BondRank"

export interface StudentSelectorProps {
  students: Student[]
  onChange?: (newId?: StudentVariantId) => void
  initialValue?: StudentVariantId
  userStatus: Map<StudentVariantId, UserStudentData>
}

interface StudentSelectorOption {
  /** 生徒ID */
  value: StudentVariantId
  /** 表示ラベル */
  label: ReactNode
  /** 検索用文字列 */
  name: string
}

const customFilterOption = (option: FilterOptionOption<StudentSelectorOption>, rawInput: string) => {
  return option.data.name.includes(rawInput)
}

export const StudentSelector = (props: StudentSelectorProps) => {
  const [selectedId, setSelectedId] = useState(props.initialValue)
  /** 選択肢 */
  const options = useMemo(() => {
    return props.students.flatMap(student => {
      return student.variants.map(variant => ({
        value: variant.id,
        label: (<div>
          <BondRank rank={props.userStatus.get(variant.id)?.currentBondRank ?? 1}></BondRank>
          <span className="ml-1">{student.name + (variant.name && `（${variant.name}）`)}</span>
        </div>),
        name: student.fullName + (variant.name && `（${variant.name}）`)
      } as StudentSelectorOption))
    })
  }, [props.students, props.userStatus])
  return <>
    <Select className="w-64 inline-block" value={options.findLast(o => o.value === selectedId)} options={options} isSearchable
      filterOption={customFilterOption}
      onChange={(v) => {
        // console.log("onChange:", v)
        props.onChange?.(v?.value)
        setSelectedId(v?.value)
      }}>
    </Select>
  </>
}
