'use client'

import { useLocalPersistence } from "@/hooks/persist";
import { useBondExpTable, useMasterData } from "@/hooks/useMasterData";
import { PersistData } from "@/types/persist";
import MainPage from "./components/pages/MainPage";
import { SoftwareApplicationJsonLd } from "next-seo";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

const PERSIST_KEY = 'persist-data'
const INITIAL_PERSIST_DATA: PersistData = { giftCountMap: {}, currentBondLevel: 1, goalBondLevel: 100, tailorStoneCount: 0 }

export default function Home() {
  const masterData = useMasterData()
  const bondExpTable = useBondExpTable()
  const [persistData, setPersistData] = useLocalPersistence<PersistData>(PERSIST_KEY, INITIAL_PERSIST_DATA)

  const theme = createTheme({
    palette: {
      mode: "light"
    }
  });

  return (
    <>
      <SoftwareApplicationJsonLd
        type="WebApplication"
        name="ブルアカ 絆ランク 計算機/シミュレータ"
        url="https://ako.zeroichi.jp/"
        applicationCategory="UtilitiesApplication"
        offers={[
          {
            price: 0,
            priceCurrency: "JPY",
            availability: "https://schema.org/InStock",
          },
        ]}
        // aggregateRating={{
        //   ratingValue: 5.0,
        //   ratingCount: 1,
        // }}
        author={
          {
            "@type": "Person",
            name: "zeroichi",
            url: "https://www.zeroichi.jp/",
          }
        }
        datePublished="2025-11-20T15:00:00+09:00"
        dateModified="2025-12-06T01:15:00+09:00"
        screenshot={{
          url: "https://public.ako.zeroichi.jp/ba-kizuna-calc.png",
          caption: "絆ランク 計算画面",
        }}
        featureList={[
          "ブルアカ 絆ランク 計算",
          "ブルアカ 絆ランク シミュレーション",
        ]}
      />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="flex items-center justify-center bg-zinc-50 font-sans">
          {
            masterData.data && bondExpTable.data && persistData
              ? <MainPage masterData={masterData.data} bondExpTable={bondExpTable.data} persistData={persistData} onPersistData={setPersistData} />
              : <div className="h-screen w-screen flex justify-center items-center">データをロード中...</div>
          }
        </div>
      </ThemeProvider>
    </>
  );
}
