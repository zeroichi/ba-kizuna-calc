'use client'

import { Student, StudentVariantId } from "@/types/master"
import { ReactNode, useMemo, useState } from "react"
import Select from "react-select"

export interface StudentSelectorProps {
  students: Student[]
  onChange?: (newId?: StudentVariantId) => void
  initialValue?: StudentVariantId
}

interface StudentSelectorOption {
  value: StudentVariantId
  label: ReactNode
}

export const StudentSelector = (props: StudentSelectorProps) => {
  const [selectedId, setSelectedId] = useState(props.initialValue)
  /** 選択肢 */
  const options = useMemo(() => {
    return props.students.flatMap(student => {
      return student.variants.map(variant => ({
        value: variant.id,
        label: student.name + (variant.name && `（${variant.name}）`)
      } as StudentSelectorOption))
    })
  }, [props.students])
  return <>
    <Select className="w-64 inline-block" value={options.findLast(o => o.value === selectedId)} options={options} isSearchable
      onChange={(v) => {
        // console.log("onChange:", v)
        props.onChange?.(v?.value)
        setSelectedId(v?.value)
      }}>
    </Select>
  </>
}
