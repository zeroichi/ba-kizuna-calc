'use client'

import { Student, StudentVariantId } from "@/types/master"
import { ReactNode, useCallback, useMemo } from "react"
import Select, { SingleValue } from "react-select"

export interface StudentSelectorProps {
  students: Student[]
  onChange?: (newId?: StudentVariantId) => void
}

interface StudentSelectorOption {
  value: StudentVariantId
  label: ReactNode
}

export const StudentSelector = (props: StudentSelectorProps) => {
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
    <Select className="w-64 inline-block" options={options} isSearchable onChange={(v) => props.onChange?.(v?.value)}></Select>
  </>
}
