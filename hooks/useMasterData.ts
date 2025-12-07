import nextConfig from "@/next.config";
import { BondExpTable, MasterData, Notifications } from "@/types/MasterData";
import axios from "axios";
import useSWR from "swr";
import { load } from "js-yaml"

const yamlFetcher = <T,>(url: string) => axios.get<string>(url).then(res => load(res.data) as T)

const basePath = nextConfig.basePath

/** マスターデータを取得する */
export const useMasterData = () => useSWR(basePath + '/data/students.yaml', yamlFetcher<MasterData>)

/** 経験値テーブルを取得する */
export const useBondExpTable = () => useSWR(basePath + '/data/bondTable.yaml', yamlFetcher<BondExpTable>)

/** ユーザーへのお知らせ一覧を取得する */
export const useNotifications = () => useSWR(basePath + '/data/notifications.yaml', yamlFetcher<Notifications>)
