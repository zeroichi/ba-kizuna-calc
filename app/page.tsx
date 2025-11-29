'use client'

import { useLocalPersistence } from "@/hooks/persist";
import { useBondExpTable, useMasterData } from "@/hooks/useMasterData";
import { PersistData } from "@/types/persist";
import MainPage from "./components/pages/MainPage";

const PERSIST_KEY = 'persist-data'
const INITIAL_PERSIST_DATA: PersistData = { giftCountMap: {}, currentBondLevel: 1, goalBondLevel: 100, tailorStoneCount: 0 }

export default function Home() {
  const masterData = useMasterData()
  const bondExpTable = useBondExpTable()
  const [persistData, setPersistData] = useLocalPersistence<PersistData>(PERSIST_KEY, INITIAL_PERSIST_DATA)

  return (
    <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {
        masterData.data && bondExpTable.data && persistData
          ? <MainPage masterData={masterData.data} bondExpTable={bondExpTable.data} persistData={persistData} onPersistData={setPersistData} />
          : <div className="h-screen w-screen flex justify-center items-center">データをロード中...</div>
      }
    </div>
  );
}
